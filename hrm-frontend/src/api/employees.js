import client from "./client";

export async function getEmployees() {
  const { data } = await client.get("/employees");
  return data?.data ?? [];
}

export async function updateEmployee(id, payload) {
  const { data } = await client.put(`/employees/${id}`, payload);
  return data?.data;
}

export async function createEmployee(payload) {
  const { data } = await client.post(`/employees`, payload);
  return data?.data;
}

export async function deleteEmployee(id) {
  const { data } = await client.delete(`/employees/${id}`);
  return data?.data;
}

