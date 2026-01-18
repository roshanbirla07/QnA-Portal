import { apiConnector } from "./apiConnector";

export const loginUser = async (method,url,body,navigate, setToken)=>{
    const response = await apiConnector(method,url,body);
    console.log(response);
    if(!response.data.success){
        throw new Error(response.data.message);
    }
    setToken(response.data.data.token);
    navigate("/");
}

export const signupUser = async (method,url,body,navigate, setToken)=>{
    const response = await apiConnector(method,url,body);
    console.log(response);
    if(!response.data.success){
        throw new Error(response.data.message);
    }
    setToken(response.data.data.token);
    navigate("/");
}