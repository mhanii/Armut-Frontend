import { users } from '../data';
import { stores } from '../data';
import http from '../http'; // Uncomment for backend
import axios from 'axios';
import  Cookies from 'js-cookie'

const USE_MOCK_DATA = false;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const  login = async (email,password) =>{

  const config = {
      headers: {
          "Accept":'application/json',
          'Content-Type':'application/json',
          'X-CSRFToken': Cookies.get('csrftoken')
      },
      withCredentials: true
  }
  const body = JSON.stringify({email,password});
  try{
      const res = await axios.post(`${BASE_URL}/accounts/login`,body,config)
      return res;

  }   
  catch(err){
      console.log(err)
  }
}

export const  signup = async (firstName, lastName, email, password, user_type) =>{

    const config = {
        headers: {
            "Accept":'application/json',
            'Content-Type':'application/json',
            'X-CSRFToken': Cookies.get('csrftoken')
        },
        withCredentials: true
    }
    const body = JSON.stringify({first_name: firstName, last_name: lastName, email, password, user_type});
    try{
        const res = await axios.post(`${BASE_URL}/accounts/signup`,body,config)
        return res;

    }   
    catch(err){
        console.log(err)
    }
}

export async function getBestStores() {
  if (USE_MOCK_DATA) {
    return stores.slice(0, 2); // mock: first 2 as best stores
  } else {
    return (await http('/stores/all/'));
  }
}

export const getProfile = async (token) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.get(`${BASE_URL}/profile/user`, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const getUserOrders = async (token) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.get(`${BASE_URL}/profile/orders`, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const createOrderFromCart = async (token, orderData) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': Cookies.get('csrftoken'),
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.post(`${BASE_URL}/profile/orders/create`, orderData, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const getVendorOrders = async (token) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.get(`${BASE_URL}/profile/vendor/orders`, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const getUserAddresses = async (token) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.get(`${BASE_URL}/profile/getaddresses`, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const addUserAddress = async (token, address) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': Cookies.get('csrftoken'),
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.post(`${BASE_URL}/profile/addaddress`, address, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const updateUserAddress = async (token, address) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': Cookies.get('csrftoken'),
            'Authorization': `Bearer ${token}`
        },
        withCredentials: true
    };
    try {
        const res = await axios.put(`${BASE_URL}/profile/updateaddress`, address, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const deleteUserAddress = async (token, addressId) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        data: { id: addressId },
        withCredentials: true
    };
    try {
        const res = await axios.delete(`${BASE_URL}/profile/deleteaddress`, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const logout = async (token) => {
    const config = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': Cookies.get('csrftoken'),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        withCredentials: true
    };
    try {
        const res = await axios.post(`${BASE_URL}/accounts/logout`, {}, config);
        return res.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
}; 