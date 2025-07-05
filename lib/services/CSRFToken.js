import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CSRFToken() {
    const [CSRFToken,setCSRFToken] = useState('')
    const getCookie = (name)=> {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        console.log(cookieValue)
        return cookieValue;
    }
    useEffect(()=>{
        const fetchData = async ()=>{
            try{
                await axios.get(`${BASE_URL}/accounts/csrf_cookie`,{withCredentials:true})
            }catch(err){
                console.log(err)
            }
        }
        fetchData();
        setCSRFToken(getCookie('csrftoken'));
        
    },[])


    return (
        <input name='csrfmiddlewaretoken' value={CSRFToken ? CSRFToken : ''} type='hidden'/>
    )
}