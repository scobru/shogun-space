/**
 * GunBay core logic class
 */
class GunBay {
    constructor(options = {}) {
        const defaultPeers = [
            "https://shogun-relay.scobrudot.dev/gun",
            location.origin + "/gun",
        ];

        this.gun =
            options.gun ||
            Gun({
                peers: defaultPeers,
                localStorage: false,
                radisk: false,
            });

        // Initialize Shogun Core
        this.shogun = new window.ShogunCore.ShogunCore({
            gunInstance: this.gun,
            webauthn: {
                enabled: true,
                rpName: "GunBay",
                rpId: window.location.hostname,
            },
            web3: {
                enabled: true
            }
        });

        // Dynamically fetch and add more relays if ShogunRelays is available
        if (window.ShogunRelays) {
            window.ShogunRelays.getRelays().then((relays) => {
                const allPeers = [...new Set([...defaultPeers, ...relays])];
                this.gun.opt({ peers: allPeers });
                console.log("GunBay: Dynamic relays added", allPeers);
            });
        }
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.publicTorrents = this.gun.get("gunbay").get("torrents");
        this.publicFeedback = this.gun.get("gunbay").get("feedback");

        this.onTorrentsUpdate = options.onTorrentsUpdate || (() => { });
        this.onFeedbackUpdate = options.onFeedbackUpdate || (() => { });
        this.onAuthUpdate = options.onAuthUpdate || (() => { });

        this.allTorrents = {};
        this.allFeedback = {}; // { torrentId: { pub: 'up'|'down' } }
        this.currentUser = null;

        this._initListeners();
    }

    _initListeners() {
        // Listen to the public index for torrent links
        this.publicTorrents.map().on((data, id) => {
            if (data === null) {
                delete this.allTorrents[id];
            } else {
                this.allTorrents[id] = { ...this.allTorrents[id], ...data };
            }
            this.onTorrentsUpdate(this.allTorrents);
        });

        // Listen to feedback
        this.publicFeedback.map().on((data, torrentId) => {
            if (!data || typeof data !== "object") return;
            if (!this.allFeedback[torrentId]) this.allFeedback[torrentId] = {};

            Object.keys(data).forEach((k) => {
                if (k === "_" || k === "#") return; // skip GunDB metadata
                if (data[k] === null) {
                    delete this.allFeedback[torrentId][k];
                } else {
                    this.allFeedback[torrentId][k] = data[k];
                }
            });
            this.onFeedbackUpdate(this.allFeedback);
        });

        // Auth listener
        this.gun.on("auth", () => {
            const is = this.user.is;
            if (is) {
                this.currentUser = { alias: is.alias || "anon", pub: is.pub };
                this.onAuthUpdate(this.currentUser);
            }
        });
    }

    login(alias, pass, callback) {
        this.user.auth(alias, pass, (ack) => {
            if (!ack.err) {
                this.currentUser = { alias, pub: ack.sea.pub || this.user.is.pub };
                this.onAuthUpdate(this.currentUser);
            }
            if (callback) callback(ack);
        });
    }

    async loginWithWebAuthn(username, callback) {
        try {
            const webauthn = this.shogun.getAuthenticationMethod('webauthn');
            if (!webauthn) throw new Error("WebAuthn plugin not found");

            const result = await webauthn.login(username);
            if (result.success) {
                this.currentUser = { alias: result.username || username, pub: result.userPub || this.user.is?.pub };
                this.onAuthUpdate(this.currentUser);
            }
            if (callback) callback(result);
            return result;
        } catch (error) {
            if (callback) callback({ err: error.message });
            throw error;
        }
    }

    async registerWithWebAuthn(username, callback) {
        try {
            const webauthn = this.shogun.getAuthenticationMethod('webauthn');
            if (!webauthn) throw new Error("WebAuthn plugin not found");

            const result = await webauthn.signUp(username, { generateSeedPhrase: true });
            if (result.success) {
                this.currentUser = { alias: result.username || username, pub: result.userPub || this.user.is?.pub };
                this.onAuthUpdate(this.currentUser);
            }
            if (callback) callback(result);
            return result;
        } catch (error) {
            if (callback) callback({ err: error.message });
            throw error;
        }
    }

    async loginWithMetaMask(callback) {
        try {
            const web3 = this.shogun.getAuthenticationMethod('web3');
            if (!web3) throw new Error("Web3 plugin not found");

            const connection = await web3.connectMetaMask();
            if (!connection.success) throw new Error(connection.error || "Failed to connect to MetaMask");

            const result = await web3.login(connection.address);
            if (result.success) {
                this.currentUser = { alias: result.username || connection.address, pub: result.userPub || this.user.is?.pub };
                this.onAuthUpdate(this.currentUser);
            }
            if (callback) callback(result);
            return result;
        } catch (error) {
            if (callback) callback({ err: error.message });
            throw error;
        }
    }

    register(alias, pass, callback) {
        this.user.create(alias, pass, (ack) => {
            if (ack.err) {
                if (callback) callback(ack);
                return;
            }
            // Auto-login after registration
            this.login(alias, pass, callback);
        });
    }

    logout() {
        this.user.leave();
        this.currentUser = null;
        this.onAuthUpdate(null);
    }

    uploadTorrent(data, callback) {
        if (!this.currentUser) return;

        const id = this.generateId();
        const entry = {
            ...data,
            uploadedAt: Date.now(),
            uploadedBy: this.currentUser.alias,
            ownerPub: this.currentUser.pub,
        };

        // 1. Write to user's own space
        this.user.get("torrents").get(id).put(entry);

        // 2. Link to the public index
        this.publicTorrents.get(id).put(entry, callback);

        return id;
    }

    deleteTorrent(id, callback) {
        if (!this.currentUser) return;
        const t = this.allTorrents[id];
        if (!t || t.ownerPub !== this.currentUser.pub) return;

        // Nullify in user space
        this.user.get("torrents").get(id).put(null);
        // Remove link from public index
        this.publicTorrents.get(id).put(null, callback);
    }

    vote(torrentId, direction) {
        if (!this.currentUser) return;

        const currentVote = this.getMyVote(torrentId);

        if (currentVote === direction) {
            // Remove vote
            this.publicFeedback.get(torrentId).get(this.currentUser.pub).put(null);
            if (this.allFeedback[torrentId])
                delete this.allFeedback[torrentId][this.currentUser.pub];
        } else {
            // Set vote
            this.publicFeedback
                .get(torrentId)
                .get(this.currentUser.pub)
                .put(direction);
            if (!this.allFeedback[torrentId]) this.allFeedback[torrentId] = {};
            this.allFeedback[torrentId][this.currentUser.pub] = direction;
        }

        this.onFeedbackUpdate(this.allFeedback);
    }

    getMyVote(torrentId) {
        if (!this.currentUser) return null;
        const fb = this.allFeedback[torrentId] || {};
        return fb[this.currentUser.pub] || null;
    }

    getFeedbackCounts(torrentId) {
        const fb = this.allFeedback[torrentId] || {};
        let up = 0,
            down = 0;
        Object.values(fb).forEach((v) => {
            if (v === "up") up++;
            else if (v === "down") down++;
        });
        return { up, down, score: up - down };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    }
}

// Export for browser
window.GunBay = GunBay;
