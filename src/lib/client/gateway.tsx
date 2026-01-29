import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const createServiceClient = (service: string): AxiosInstance => {
  const client = axios.create({
    // TODO: change fcking stupid HARDCODE here to config kub 😘
    // baseURL: 'https://api.termgame.uk',
    baseURL: 'http://localhost:9000',
    headers: {
      "Content-Type": "application/json",
      XSN: service,
    },
    withCredentials: true, // for credentials store cookie kub 🍪
    // TODO: make XSRF Token
    // withXSRFToken: true,
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  return client;
};

export const authClient = createServiceClient('auth');
export const productClient = createServiceClient('product');
export const userClient = createServiceClient('user');
export const merchantClient = createServiceClient('merchant');
