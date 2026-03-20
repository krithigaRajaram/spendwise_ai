import { API_BASE_URL } from "../config";

export const fetchMonthlyReport = async ({ month, year, from, to }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const params = new URLSearchParams();
  if (from && to) {
    params.set("from", from);
    params.set("to", to);
  } else {
    params.set("month", month);
    params.set("year", year);
  }

  const response = await fetch(`${API_BASE_URL}/reports/monthly?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error("Failed to fetch report");
  return response.json();
};