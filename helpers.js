export function matchesExamMonth(examDetails) {
  return pdfMonth.some(({ month, year }) => {
    const regex = new RegExp(`${year}\\s+${month}`, "i");
    return regex.test(examDetails);
  });
}
