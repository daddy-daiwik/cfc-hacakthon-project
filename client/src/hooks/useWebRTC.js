import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useWebRTC(roomId, isInRoom) {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [remoteStreams, setRemoteStreams] = useState(new Map()); // peerId -> { stream, username }
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const peerRef = useRef(null);
    const connectionsRef = useRef(new Map());
    const localStreamRef = useRef(null);

    const [error, setError] = useState(null);

    // Get local audio stream
    const getLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Failed to get microphone:', err);
            if (window.location.hostname !== 'localhost' && window.location.protocol === 'http:') {
                setError('Microphone blocked! On LAN, Chrome requires HTTPS or a flag. Go to chrome://flags/#unsafely-treat-insecure-origin-as-secure, add this URL, enable, and relaunch.');
            } else {
                setError('Microphone access denied. Please allow microphone access.');
            }
            return null;
        }
    }, []);

    // Initialize Peer and connect
    useEffect(() => {
        if (!isInRoom || !socket || !user || !roomId) return;

        let destroyed = false;

        const init = async () => {
            const stream = await getLocalStream();
            if (!stream || destroyed) return;

            // Create PeerJS instance
            const peer = new Peer(undefined, {
                host: window.location.hostname,
                port: 3002,
                path: '/peerjs',
                debug: 0,
            });

            peerRef.current = peer;

            peer.on('open', (peerId) => {
                if (destroyed) return;
                console.log('🎙️ Peer opened:', peerId);

                // Register our peer ID with the server
                socket.emit('peer:register', { roomId, peerId });

                // Get existing peers in the room
                socket.emit('peer:get-peers', { roomId }, ({ success, peers }) => {
                    if (success && !destroyed) {
                        peers.forEach(({ peerId: remotePeerId, username }) => {
                            callPeer(remotePeerId, username, stream);
                        });
                    }
                });
            });

            // Receive calls from new participants
            peer.on('call', (call) => {
                if (destroyed) return;
                console.log('📞 Incoming call from:', call.metadata?.username);
                call.answer(stream);

                call.on('stream', (remoteStream) => {
                    if (destroyed) return;
                    setRemoteStreams(prev => {
                        const next = new Map(prev);
                        next.set(call.peer, { stream: remoteStream, username: call.metadata?.username || 'Unknown' });
                        return next;
                    });
                });

                call.on('close', () => {
                    setRemoteStreams(prev => {
                        const next = new Map(prev);
                        next.delete(call.peer);
                        return next;
                    });
                });

                connectionsRef.current.set(call.peer, call);
            });

            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
            });

            // Listen for new peers joining after us
            socket.on('peer:new', ({ peerId: remotePeerId, username }) => {
                if (!destroyed) {
                    callPeer(remotePeerId, username, stream);
                }
            });
        };

        const callPeer = (remotePeerId, username, stream) => {
            if (connectionsRef.current.has(remotePeerId)) return;

            console.log('📞 Calling peer:', username);
            const call = peerRef.current.call(remotePeerId, stream, {
                metadata: { username: user.username },
            });

            if (!call) return;

            call.on('stream', (remoteStream) => {
                setRemoteStreams(prev => {
                    const next = new Map(prev);
                    next.set(remotePeerId, { stream: remoteStream, username });
                    return next;
                });
            });

            call.on('close', () => {
                setRemoteStreams(prev => {
                    const next = new Map(prev);
                    next.delete(remotePeerId);
                    return next;
                });
            });

            connectionsRef.current.set(remotePeerId, call);
        };

        init();

        return () => {
            destroyed = true;
            // Clean up all connections
            connectionsRef.current.forEach(call => call.close());
            connectionsRef.current.clear();
            setRemoteStreams(new Map());

            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
                setLocalStream(null);
            }

            socket.off('peer:new');
        };
    }, [isInRoom, roomId, socket, user]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                // Notify server
                if (socket) {
                    socket.emit('self:toggle-mute', { roomId, isMuted: !audioTrack.enabled });
                }
            }
        }
    }, [socket, roomId]);

    // Forcibly mute (called when host mutes you)
    const forceMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
                setIsMuted(true);
            }
        }
    }, []);

    return { remoteStreams, localStream, isMuted, toggleMute, forceMute, error };
}
