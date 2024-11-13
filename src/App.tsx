import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./Pages/Landing";
import Room from "./Pages/Room";


const App = () => {
  return (
    <div>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/Room" element={<Room/>}/>
        </Routes>
        </BrowserRouter>
      
    </div>
  );
};

export default App;