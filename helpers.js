const pdfMonth = [
  {
    month: "august",
    year: 2025,
  },
  {
    month: "november",
    year: 2025,
  },
  {
    month: "february",
    year: 2026,
  },
];

export function matchesExamMonth(examDetails) {
  return pdfMonth.some(({ month, year }) => {
    const regex = new RegExp(`${year}\\s+${month}`, "i");
    return regex.test(examDetails);
  });
}
