import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from "../context/SocketProvider.jsx"
import { useNavigate } from "react-router-dom"
const Lobby = () => {
  const [formData, setFormData] = useState({ email: "", room: "" })
  const navigate = useNavigate()
  const socket = useSocket()
  const handleOnSubmit = useCallback((e) => {
    e.preventDefault()
    console.log(socket)
    socket.emit("room:join", formData)
  }, [formData.email, formData.room])
  const handleOnChange = (e) => {
    setFormData((prev) => {
      return {
        ...prev, [e.target.name]: e.target.value
      }
    })
  }
  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data
    console.log(email, room)
    navigate(`/room/${room}`)
  }, [])
  useEffect(() => {
    socket.on("room:join", handleJoinRoom)
    return () => {
      socket.off("room:join", handleJoinRoom)
    }
  }, [socket])
  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleOnSubmit}>
        <label htmlFor='email'>Email</label>
        <input type='email' id='email' name='email' value={formData.email} onChange={handleOnChange} />
        <br />
        <label htmlFor='room'>Room</label>

        <input type='text' id='room' name='room' value={formData.room} onChange={handleOnChange} />
        <br />

        <button type='submit'>Submit</button>
      </form>
    </div>
  )
}

export default Lobby