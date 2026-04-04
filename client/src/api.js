const BASE_URL = import.meta.env.VITE_API_URL;

export const apiGet = async (path, token) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
};

export const apiPost = async (path, body, token) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    return res.json();
};

export const apiPut = async (path, body, token) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    return res.json();
};

export const apiDelete = async (path, token) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.json();
};