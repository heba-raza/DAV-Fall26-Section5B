LAB 9 D3.JS PROJECT — TASKS 1–6

FILES
- index.html: all six visualizations, with tabs.
- dataset/custom.geo.json: the GeoJSON file uploaded for this lab.

  dataset/university.csv
  dataset/flights.csv
  dataset/population.csv
  dataset/pakistan_cities.csv

EXPECTED COLUMNS FROM THE LAB MANUAL
- university.csv: department, course, students
- flights.csv: source, target, flights
- population.csv: id, country, population_millions
- pakistan_cities.csv: name, lat, lon, pop

RUN
1. Extract the project folder if it is zipped.
2. Open Lab9_Project in VS Code.
3. Put the four CSV files in the dataset folder beside custom.geo.json.
4. Install/use the Live Server extension if needed.
5. Right-click index.html -> Open with Live Server.
6. Check browser DevTools Console if a chart fails.

NOTES
- The population join uses a country code matched to GeoJSON properties. The provided GeoJSON has adm0_a3 country codes; population.csv id should use matching codes (for example ISO-3 codes) for the choropleth to color correctly.
- The map tasks use the supplied custom.geo.json file and expect it to contain world country polygons including Pakistan.
- This project intentionally does not invent the missing course, flight, population, or city data. All charts read the actual CSV files.

