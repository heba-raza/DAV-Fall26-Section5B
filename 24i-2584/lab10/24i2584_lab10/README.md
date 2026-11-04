# Air Quality 2025 Dashboard — Lab 10

## Files
- `index.html` — dashboard layout and styles
- `script.js` — D3.js data loading, cleaning, calculations and all 8 charts
- `dataset/air_quality_2025.csv` — cleaned, sorted dataset used by the dashboard

## Run the project
1. Extract the ZIP.
2. Open the extracted `Lab10_Air_Quality_Dashboard` folder in VS Code.
3. Install/enable the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The page uses D3.js v7 from jsDelivr CDN, so an internet connection is required.
6. Open browser Developer Tools → Console if you need to check for errors.

Do not open `index.html` by double-clicking it; browsers may block CSV loading from a local `file://` URL.

## Data cleaning performed
- Parsed `date` values and converted measurements to numeric values.
- Removed rows with invalid dates, missing/non-numeric measurements, negative PM2.5 values, and duplicate dates.
- Sorted records chronologically.
- Preserved genuine missing calendar dates. The missing period is not filled with zero or interpolated because Lab 10 Task 8 requires the gap to remain visible.

## Lab task mapping
1. Dataset row count, first/last date, and missing-date inspection (shown in KPI cards and console).
2. Daily city PM2.5 line, WHO reference lines at 15 and 75, top two days, threshold counts.
3. Cumulative count of city-centre days above 75.
4. City vs suburb daily line chart.
5. Monthly stacked columns for Low / Moderate / High / Severe city-centre days.
6. Month × weekday heatmap of average city-centre PM2.5.
7. Monthly minimum–maximum band and mean line.
8. Daily series, 7-day moving average, and explicitly marked sensor-offline gap.
9. Brushable overview chart with a reset button.

## Before submitting
- Add your roll number and section to the folder name as required by your instructor.
- Test the dashboard in Live Server and inspect the browser console.
- Upload the HTML, JS and dataset to the correct GitHub section/week folder.
- Upload a ZIP to GCR using your instructor's required filename convention.
- Confirm your course's required naming convention; this package is named descriptively, not with your personal roll number.

## Interpretation caution
The manual describes the CSV as a practice dataset, not official measurements. The dashboard's director briefing is computed from this dataset and should be reviewed before presenting.
