import { createContext, useContext, useState } from 'react';
import { solicitarOtp, verificarOtp } from '../api/clienteApi';

const ClienteAuthContext = createContext(null);

export function ClienteAuthProvider({ children }) {
  const [cliente, setCliente] = useState(() => {
    const raw = localStorage.getItem('clienteInfo');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('clienteToken'));

  async function pedirOtp(telefono, nombre) {
    return solicitarOtp(telefono, nombre);
  }

  async function confirmarOtp(telefono, codigo) {
    const data = await verificarOtp(telefono, codigo);
    setToken(data.token);
    setCliente(data.cliente);
    localStorage.setItem('clienteToken', data.token);
    localStorage.setItem('clienteInfo', JSON.stringify(data.cliente));
  }

  function logout() {
    setToken(null);
    setCliente(null);
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteInfo');
  }

  return (
    <ClienteAuthContext.Provider value={{ cliente, token, pedirOtp, confirmarOtp, logout }}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  return useContext(ClienteAuthContext);
}
