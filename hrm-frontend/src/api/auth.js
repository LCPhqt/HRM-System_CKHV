import client from "./client";

export async function login(payload) {
  const { data } = await client.post("/auth/login", payload);
  return data?.data;
}

export async function register(payload) {
  const { data } = await client.post("/auth/register", payload);
  return data?.data;
}

export async function updateProfile(payload) {
  const { data } = await client.patch("/auth/profile", payload);
  return data?.data;
}
