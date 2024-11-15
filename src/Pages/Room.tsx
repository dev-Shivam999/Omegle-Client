import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Room = () => {
    const Socket = useMemo(() => new WebSocket("ws://localhost:3000"), []);
    const [searchParams] = useSearchParams();
    const query = searchParams.get('name');
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const getCam = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([videoTrack]);
            await localVideoRef.current.play();
        }
    };

    const handleTrackEvent = (event: RTCTrackEvent) => {
        const { track } = event;
        if (remoteVideoRef.current) {
            if (!remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.srcObject = new MediaStream();
            }
            (remoteVideoRef.current.srcObject as MediaStream).addTrack(track);
        }
    };

    useEffect(() => {
        getCam();
    }, []);

    useEffect(() => {
        Socket.onopen = () => {
            Socket.send(JSON.stringify({ event: "User", UserId: query }));
        };

        Socket.onmessage = async (message) => {
            const data = JSON.parse(message.data);
            console.log(data);

            if (data.event === "send-offer") {
                const pc = new RTCPeerConnection();
                setSendingPc(pc);

                if (localAudioTrack && localVideoTrack) {
                    pc.addTrack(localAudioTrack);
                    pc.addTrack(localVideoTrack);
                }

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        Socket.send(JSON.stringify({
                            event: "ice-candidate",
                            candidate: event.candidate,
                            roomId: data.roomId
                        }));
                    }
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                Socket.send(JSON.stringify({ event: "offer", sdp: offer.sdp, roomId: data.roomId }));
            } else if (data.event === "offer") {
                const pc = new RTCPeerConnection();
                setReceivingPc(pc);

                pc.ontrack = handleTrackEvent;
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        Socket.send(JSON.stringify({
                            event: "ice-candidate",
                            candidate: event.candidate,
                            roomId: data.roomId
                        }));
                    }
                };

                await pc.setRemoteDescription({ sdp: data.offer, type: "offer" });

                if (localAudioTrack && localVideoTrack) {
                    pc.addTrack(localAudioTrack);
                    pc.addTrack(localVideoTrack);
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                Socket.send(JSON.stringify({ event: "answer", sdp: answer.sdp, roomId: data.roomId }));
            } else if (data.event === "answer") {
                if (sendingPc) {
                    await sendingPc.setRemoteDescription({
                        type: "answer",
                        sdp: data.answer
                    });
                }
            } else if (data.event === "ice-candidate") {
                const candidate = new RTCIceCandidate(data.candidate);
                (sendingPc || receivingPc)?.addIceCandidate(candidate);
            }
        };

        return () => {
            Socket.close();
            sendingPc?.close();
            receivingPc?.close();
        };
    }, [query, localAudioTrack, localVideoTrack]);

    return (
        <div>
            <div>Room</div>
            <video ref={localVideoRef} width={400} height={400} autoPlay muted></video>
            <video ref={remoteVideoRef} width={400} height={400} autoPlay></video>
        </div>
    );
};

export default Room;
