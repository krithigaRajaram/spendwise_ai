export const fetchMonthlyReport = async (month, year) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `http://localhost:3000/reports/monthly?month=${month}&year=${year}`,
    {
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MjEwOTU1MSwiZXhwIjoxNzcyMTEzMTUxfQ.2yYUNQ2ePMS2gA6wR7Z_fmVW7Vvoxw3C03G3YlI7FFQ",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch report");
  }

  return response.json();
};