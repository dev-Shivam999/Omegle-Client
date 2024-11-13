import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
    const [name,setName]=useState("")
    const navigation = useNavigate()
    return (
        <div>
 <input type="text" onChange={(e)=>setName(e.target.value)} placeholder="Name..." className="bg-transparent border-2 border-white rounded-lg" />
 <button onClick={()=>navigation(`/Room/?name=${name}`)}>Join</button>
        </div>
    );
};

export default Landing;