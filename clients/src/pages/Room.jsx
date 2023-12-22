import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from "react-player"
import peer from '../services/peer'
const Room = () => {
  const socket = useSocket()
  const [remoteSocketId, setRemoteSocketId] = useState(null)
  const [stream, setStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const sendStreams = useCallback(async () => {
    for (const track of stream.getTracks()) {
      peer.peer.addTrack(track, stream)
    }
  }, [stream])
  const handleUserJoin = useCallback(({ id, email }) => {
    console.log(`${email} joined`)
    setRemoteSocketId(id)
  }, [])
  const handleJoin = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const offer = await peer.getOffer()
    socket.emit("user:call", {
      to: remoteSocketId, offer
    })
    setStream(stream)
  }, [socket, remoteSocketId])
  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );
  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    peer.setLocalDescription(ans)
    console.log("call accepted")
    sendStreams()
  }, [sendStreams])
  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer()
    socket.emit("peer:negotiation:needed", {
      offer, to: remoteSocketId
    })
  }, [remoteSocketId, socket])
  const handleIncommingNegotiation = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer)
    socket.emit("peer:negotiation:done", {
      to: from, ans
    })

  }, [socket])
  const handleFinalNegotiation = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans)
  }, [])


  useEffect(() => {
    peer.peer.addEventListener("track", (event) => {
      const remoteStream = event.streams
      setRemoteStream(remoteStream[0])
    })
  }, [])
  useEffect(() => {
    socket.on("user:joined", handleUserJoin)

    socket.on("incomming:call", handleIncommingCall)
    socket.on("call:accepted", handleCallAccepted)
    socket.on("peer:negotiation:needed", handleIncommingNegotiation)
    socket.on("peer:negotiation:final", handleFinalNegotiation)
    return () => {
      socket.off("user:joined", handleUserJoin)
      socket.off("incomming:call", handleIncommingCall)
      socket.off("call:accepted", handleCallAccepted)
      socket.off("peer:negotiation:needed", handleIncommingNegotiation)
      socket.off("peer:negotiation:final", handleFinalNegotiation)



    }
  }, [socket, handleUserJoin, handleIncommingCall, handleCallAccepted, handleIncommingNegotiation, handleFinalNegotiation])
  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded)
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegotiationNeeded)

    }
  }, [handleNegotiationNeeded])
  return (
    <>
      <h1>Room</h1>
      {
        remoteSocketId ? <><p>Connected</p> <button onClick={handleJoin}>Join</button> </> : <p>No one else is here</p>
      }
      {
        stream && <><button onClick={sendStreams}>Send Stream</button> <p>My Stream</p><ReactPlayer playing muted height="200px" width="200px" url={stream} /></>
      }
      {
        remoteStream && <> <p>Remote Stream</p><ReactPlayer playing muted height="200px" width="200px" url={remoteStream} /></>
      }
    </>
  )
}

export default Room