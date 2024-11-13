import { useEffect } from "react";
import {  useSearchParams } from "react-router-dom";


const Room = () => {
    const [searchParams]=useSearchParams()
    const query = searchParams.get('name')
   
    
    useEffect(()=>{
        console.log(query);
        
    },[query])
    
    
    return (
        <div>
           room 
        </div>
    );
};

export default Room;