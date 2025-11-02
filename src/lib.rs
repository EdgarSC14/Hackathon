//!
//! Contrato de Comunidad de Creativos Stylus
//! Sistema completo de membresía, préstamos y finanzas inclusivas
//!
//! Funcionalidades:
//! - Suscripción con 0.00001 ETH para miembros
//! - Sistema de préstamos para creativos
//! - Seguimiento de pagos y balances
//! - Verificación de membresía
//!

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use stylus_sdk::{
    prelude::*,
    alloy_primitives::{Address, U256, B256},
};
use alloc::vec::Vec;

sol_storage! {
    #[entrypoint]
    pub struct CreativeFinance {
        // Admin
        address admin;

        // Artistas, canciones, supporters
        mapping(address => Artist) artists;
        mapping(uint256 => Song) songs;
        mapping(address => Supporter) supporters;
        uint256 song_counter;

        // Acumuladores
        uint256 system_balance;
        uint256 incentive_pool;

        // Control
        bool paused;
        bool reentrancy_lock;

        // Retiro automático
        address withdrawal_target;
        uint256 withdrawal_threshold;
        uint256 withdrawal_interval;
        uint256 last_withdrawal_timestamp;
    }

    pub struct Artist {
        bool registered;
        uint256 total_received;
        uint256 song_count;
    }

    pub struct Song {
        address artist;
        bytes32 title_hash;
        bytes32 ipfs_hash;
        uint256 total_received;
    }

    pub struct Supporter {
        uint256 total_donations;
        uint256 donation_count;
    }
}

#[public]
impl CreativeFinance {
    /// Inicializa el contrato (una vez)
    pub fn init(&mut self) -> Result<(), Vec<u8>> {
        if self.admin.get() != Address::ZERO { return Err(b"Ya inicializado".into()); }
        self.admin.set(self.vm().msg_sender());
        Ok(())
    }

    /// Admin utils
    pub fn set_admin(&mut self, new_admin: Address) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.admin.get() { return Err(b"Solo admin".into()); }
        if new_admin == Address::ZERO { return Err(b"Admin invalido".into()); }
        self.admin.set(new_admin);
        Ok(())
    }

    pub fn pause(&mut self) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.admin.get() { return Err(b"Solo admin".into()); }
        self.paused.set(true);
        Ok(())
    }

    pub fn unpause(&mut self) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.admin.get() { return Err(b"Solo admin".into()); }
        self.paused.set(false);
        Ok(())
    }

    pub fn set_withdrawal_config(
        &mut self,
        target: Address,
        threshold: U256,
        interval: U256,
    ) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.admin.get() { return Err(b"Solo admin".into()); }
        if target == Address::ZERO { return Err(b"Destino invalido".into()); }
        if threshold == U256::ZERO { return Err(b"Umbral invalido".into()); }
        if interval == U256::ZERO { return Err(b"Intervalo invalido".into()); }
        self.withdrawal_target.set(target);
        self.withdrawal_threshold.set(threshold);
        self.withdrawal_interval.set(interval);
        Ok(())
    }

    pub fn withdraw_system_balance(&mut self, to: Address, amount: U256) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.admin.get() { return Err(b"Solo admin".into()); }
        if to == Address::ZERO { return Err(b"Destino invalido".into()); }
        if amount == U256::ZERO { return Err(b"Monto invalido".into()); }
        if amount > self.system_balance.get() { return Err(b"Saldo insuficiente".into()); }
        if self.reentrancy_lock.get() { return Err(b"Reentrancy".into()); }
        self.reentrancy_lock.set(true);
        self.vm().transfer_eth(to, amount)?;
        self.system_balance.set(self.system_balance.get() - amount);
        self.reentrancy_lock.set(false);
        Ok(())
    }

    pub fn withdraw_system_balance_all(&mut self, to: Address) -> Result<(), Vec<u8>> {
        let amt = self.system_balance.get();
        if amt == U256::ZERO { return Err(b"Sin saldo".into()); }
        self.withdraw_system_balance(to, amt)
    }

    pub fn maybe_auto_withdraw(&mut self) -> Result<bool, Vec<u8>> {
        let target = self.withdrawal_target.get();
        let threshold = self.withdrawal_threshold.get();
        let interval = self.withdrawal_interval.get();
        if target == Address::ZERO || threshold == U256::ZERO || interval == U256::ZERO { return Ok(false); }
        let now = U256::from(self.vm().block_timestamp());
        if now < self.last_withdrawal_timestamp.get() + interval { return Ok(false); }
        if self.system_balance.get() < threshold { return Ok(false); }
        if self.reentrancy_lock.get() { return Err(b"Reentrancy".into()); }
        self.reentrancy_lock.set(true);
        self.vm().transfer_eth(target, threshold)?;
        self.system_balance.set(self.system_balance.get() - threshold);
        self.last_withdrawal_timestamp.set(now);
        self.reentrancy_lock.set(false);
        Ok(true)
    }

    /// Registrar artista (no almacenamos strings, solo marcar registro)
    pub fn register_artist(&mut self) -> Result<(), Vec<u8>> {
        if self.paused.get() { return Err(b"Pausado".into()); }
        let sender = self.vm().msg_sender();
        let existing = self.artists.get(sender);
        if existing.registered.get() { return Err(b"Ya registrado".into()); }
        let mut st = self.artists.setter(sender);
        st.registered.set(true);
        st.total_received.set(U256::ZERO);
        st.song_count.set(U256::ZERO);
        Ok(())
    }

    /// Subir cancion con hashes (title_hash, ipfs_hash)
    pub fn upload_song(&mut self, title_hash: B256, ipfs_hash: B256) -> Result<U256, Vec<u8>> {
        if self.paused.get() { return Err(b"Pausado".into()); }
        let sender = self.vm().msg_sender();
        let artist = self.artists.get(sender);
        if !artist.registered.get() { return Err(b"Artista no registrado".into()); }
        let id = self.song_counter.get();
        self.song_counter.set(id + U256::from(1));
        let mut s = self.songs.setter(id);
        s.artist.set(sender);
        s.title_hash.set(title_hash);
        s.ipfs_hash.set(ipfs_hash);
        s.total_received.set(U256::ZERO);
        let prev_count = artist.song_count.get();
        let mut art = self.artists.setter(sender);
        art.song_count.set(prev_count + U256::from(1));
        Ok(id)
    }

    /// Donar a una cancion
    #[payable]
    pub fn donate(&mut self, song_id: U256) -> Result<(), Vec<u8>> {
        if self.paused.get() { return Err(b"Pausado".into()); }
        if self.reentrancy_lock.get() { return Err(b"Reentrancy".into()); }
        let donation = self.vm().msg_value();
        if donation == U256::ZERO { return Err(b"Monto invalido".into()); }
        let song_ro = self.songs.get(song_id);
        if song_ro.artist.get() == Address::ZERO { return Err(b"Cancion no encontrada".into()); }
        let artist_addr = song_ro.artist.get();

        let artist_share = donation * U256::from(80) / U256::from(100);
        let system_share = donation * U256::from(12) / U256::from(100);
        let incentive_share = donation * U256::from(8) / U256::from(100);
        let allocated = artist_share + system_share + incentive_share;

        self.reentrancy_lock.set(true);
        self.vm().transfer_eth(artist_addr, artist_share)?;
        self.system_balance.set(self.system_balance.get() + system_share);
        self.incentive_pool.set(self.incentive_pool.get() + incentive_share);
        if donation > allocated {
            self.system_balance.set(self.system_balance.get() + (donation - allocated));
        }
        // actualizar contadores
        let prev_song_total = song_ro.total_received.get();
        let mut s = self.songs.setter(song_id);
        s.total_received.set(prev_song_total + artist_share);
        let artist_ro = self.artists.get(artist_addr);
        let prev_artist_total = artist_ro.total_received.get();
        let mut a = self.artists.setter(artist_addr);
        a.total_received.set(prev_artist_total + artist_share);

        // supporter
        let sender = self.vm().msg_sender();
        let supp_ro = self.supporters.get(sender);
        let prev_don = supp_ro.total_donations.get();
        let prev_cnt = supp_ro.donation_count.get();
        let mut sup_set = self.supporters.setter(sender);
        sup_set.total_donations.set(prev_don + donation);
        sup_set.donation_count.set(prev_cnt + U256::from(1));

        self.reentrancy_lock.set(false);
        Ok(())
    }

    /// Distribuir incentivos a 3 direcciones
    pub fn distribute_incentives(&mut self, a1: Address, a2: Address, a3: Address) -> Result<(), Vec<u8>> {
        if self.vm().msg_sender() != self.admin.get() { return Err(b"Solo admin".into()); }
        if self.paused.get() { return Err(b"Pausado".into()); }
        if a1 == Address::ZERO || a2 == Address::ZERO || a3 == Address::ZERO { return Err(b"Destino invalido".into()); }
        if a1 == a2 || a1 == a3 || a2 == a3 { return Err(b"Duplicado".into()); }
        if self.reentrancy_lock.get() { return Err(b"Reentrancy".into()); }
        let pool = self.incentive_pool.get();
        if pool == U256::ZERO { return Err(b"Sin incentivos".into()); }
        let first = pool * U256::from(50) / U256::from(100);
        let second = pool * U256::from(30) / U256::from(100);
        let third = pool - first - second; // asegura total
        self.reentrancy_lock.set(true);
        self.vm().transfer_eth(a1, first)?;
        self.vm().transfer_eth(a2, second)?;
        self.vm().transfer_eth(a3, third)?;
        self.incentive_pool.set(U256::ZERO);
        self.reentrancy_lock.set(false);
        Ok(())
    }

    /// Getters simples
    pub fn get_balances(&self) -> Result<(U256, U256), Vec<u8>> {
        Ok((self.system_balance.get(), self.incentive_pool.get()))
    }

    pub fn get_song_info(&self, song_id: U256) -> Result<(Address, B256, B256, U256), Vec<u8>> {
        let s = self.songs.get(song_id);
        if s.artist.get() == Address::ZERO { return Err(b"Cancion no encontrada".into()); }
        Ok((s.artist.get(), s.title_hash.get(), s.ipfs_hash.get(), s.total_received.get()))
    }

    pub fn get_supporter_info(&self, addr: Address) -> Result<(U256, U256), Vec<u8>> {
        let s = self.supporters.get(addr);
        Ok((s.total_donations.get(), s.donation_count.get()))
    }
}
