const axios = require('axios');
const { IDENTITY_SERVICE_URL, PROFILE_SERVICE_URL } = require('../config/services');

async function listEmployees(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const [usersRes, profilesRes] = await Promise.all([
    axios.get(`${IDENTITY_SERVICE_URL}/users`, { headers }),
    axios.get(`${PROFILE_SERVICE_URL}/profiles`, { headers })
  ]);
  const users = usersRes.data || [];
  const profiles = profilesRes.data || [];
  const profileByUserId = new Map(profiles.map((p) => [String(p.user_id), p]));
  return users.map((u) => {
    const profile = profileByUserId.get(String(u.id)) || null;
    const joined_at =
      profile?.created_at ||
      profile?.createdAt ||
      u.created_at ||
      u.createdAt ||
      null;
    return {
      ...u,
      profile,
      joined_at
    };
  });
}

async function deleteEmployee(token, id) {
  const headers = { Authorization: `Bearer ${token}` };
  // Xóa profile trước (nếu có), sau đó xóa user
  try {
    await axios.delete(`${PROFILE_SERVICE_URL}/profiles/${id}`, { headers });
  } catch (err) {
    // nếu 404 profile không có, bỏ qua; các lỗi khác ném ra
    if (err.response?.status !== 404) throw err;
  }
  await axios.delete(`${IDENTITY_SERVICE_URL}/users/${id}`, { headers });
  return { success: true };
}

async function getEmployee(token, id) {
  const headers = { Authorization: `Bearer ${token}` };
  const [userRes, profileRes] = await Promise.all([
    axios.get(`${IDENTITY_SERVICE_URL}/users/${id}`, { headers }),
    axios.get(`${PROFILE_SERVICE_URL}/profiles/${id}`, { headers })
  ]);
  return { ...userRes.data, profile: profileRes.data || null };
}

async function updateEmployee(token, id, payload) {
  const headers = { Authorization: `Bearer ${token}` };
  const { email, role, ...profilePayload } = payload;
  // update user (email/role)
  const userRes = await axios.put(`${IDENTITY_SERVICE_URL}/users/${id}`, { email, role }, { headers });
  // update profile fields
  const profileRes = await axios.put(
    `${PROFILE_SERVICE_URL}/profiles/${id}`,
    { email, ...profilePayload },
    { headers }
  );
  return { ...userRes.data, profile: profileRes.data || null };
}

module.exports = { listEmployees, getEmployee, deleteEmployee, updateEmployee };

