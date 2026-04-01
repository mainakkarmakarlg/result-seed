export const extractCourseId = (examDetails, response) => {
  const level = examDetails.level;
  // examDetails.examDetails is a string like "2025 February Level I CFA Exam"
  const examString = examDetails.examDetails || "";
  const examType = examString.includes("CFA") ? "CFA" : "FRM";
  const parts = examString.split(" ");
  const examYear = parts[0];
  const examSession = (parts[1] || "").substring(0, 3);

  const levelAbbr = `L-${level}`;
  let id;

  if (examType === "CFA") {
    const levelCourse = response?.data[0]?.Courses?.find(
      (d) => d.abbr === levelAbbr
    );

    if (level === 1 || level === 2) {
      const courseYearObj = levelCourse?.Courses;
      console.log("corseYearObj: ", courseYearObj);
      console.log("exam year: ", examYear);
      console.log("courseYearObj: ", courseYearObj);
      const courseMonthObj = courseYearObj?.find((d) => d.name === examYear);
      const courseObj = courseMonthObj?.Courses?.find(
        (d) => d.name === examSession
      );

      id = courseObj?.id;
    }

    if (level === 3) {
      const courseYearObj = levelCourse?.Courses;
      const courseMonthObj = courseYearObj
        ?.flatMap((course) => course?.Courses || [])
        .find((d) => d.name === examYear);

      const courseObj = courseMonthObj?.Courses?.find(
        (d) => d.name === examSession
      );

      id = courseObj?.id;
    }
  } else if (examType === "FRM") {
    const levelCourse = response?.data[1]?.Courses?.find(
      (d) => d.abbr === levelAbbr
    );
    const courseYearObj = levelCourse?.Courses;
    const courseMonthObj = courseYearObj?.find(
      (course) => course?.name === examYear
    )?.Courses;
    id = courseMonthObj?.find((course) => course?.name == examSession)?.id;
  }

  console.log("id: ", id);
  return id;
};
export default extractCourseId;
