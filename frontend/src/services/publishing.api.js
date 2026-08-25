import { apiConnector } from "./apiConnector";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api/v1";

export const publishingApi = {
  getFeed: (params = {}) => apiConnector("GET", `${API_BASE}/feed`, null, null, params),
  getFollowingFeed: (params = {}) => apiConnector("GET", `${API_BASE}/feed/following`, null, null, params),
  search: (params = {}) => apiConnector("GET", `${API_BASE}/feed/search`, null, null, params),
  getPost: (slug) => apiConnector("GET", `${API_BASE}/posts/${slug}`),
  createPost: (payload) => apiConnector("POST", `${API_BASE}/posts`, payload),
  updatePost: (postId, payload) => apiConnector("PATCH", `${API_BASE}/posts/${postId}`, payload),
  publishPost: (postId) => apiConnector("POST", `${API_BASE}/posts/${postId}/publish`),
  getMyPosts: (params = {}) => apiConnector("GET", `${API_BASE}/posts/me`, null, null, params),
  recordView: (slug) => apiConnector("POST", `${API_BASE}/posts/${slug}/view`),
  getAnswers: (questionId) => apiConnector("GET", `${API_BASE}/questions/${questionId}/answers`),
  addAnswer: (questionId, payload) => apiConnector("POST", `${API_BASE}/questions/${questionId}/answers`, payload),
  acceptAnswer: (questionId, answerId) => apiConnector("POST", `${API_BASE}/questions/${questionId}/answers/${answerId}/accept`),
  vote: (payload) => apiConnector("POST", `${API_BASE}/interactions/votes`, payload),
  getBookmarks: () => apiConnector("GET", `${API_BASE}/interactions/bookmarks`),
  bookmark: (postId) => apiConnector("POST", `${API_BASE}/interactions/bookmarks/${postId}`),
  removeBookmark: (postId) => apiConnector("DELETE", `${API_BASE}/interactions/bookmarks/${postId}`),
  follow: (userId) => apiConnector("POST", `${API_BASE}/interactions/follows/${userId}`),
  unfollow: (userId) => apiConnector("DELETE", `${API_BASE}/interactions/follows/${userId}`),
  getProfile: (username) => apiConnector("GET", `${API_BASE}/profiles/${username}`),
};
