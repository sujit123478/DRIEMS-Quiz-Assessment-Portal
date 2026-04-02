const { default: axiosInstance } = require('.');

export const addCheatingEvent = async (payload) => {
  try {
    const response = await axiosInstance.post('/api/cheating/log-cheating', payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
