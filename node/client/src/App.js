import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiResponse, setApiResponse] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    async function fetchData() {
      let _countries = localStorage.getItem('countries');
      if (_countries === null) {
        fetch("http://localhost:9000/countries")
          .then(response => response.json())
          .then(data => {
            setApiResponse(data.countries)
            localStorage.setItem('countries', JSON.stringify(data.countries));
          });
      }
      else {
        setApiResponse(JSON.parse(_countries))
      }
    }
    fetchData();
  }, []);

  function handleCountryChange(e) {
    let country = e.target.value;
    let _data = localStorage.getItem(country);
    setSelectedCountry(country);
    if (_data === null) {
      fetch(`http://localhost:9000/countrydata?country=${country}`)
        .then(response => response.json())
        .then(data => {
          setCountryData(data.data)
          localStorage.setItem(country, JSON.stringify(data.data));
        });
    }
    else {
      setCountryData(JSON.parse(_data))
    }
  }

  return (
    <div className="App">
      <header className="App-header">

        <select onChange={(e) => { handleCountryChange(e) }} value={selectedCountry}>
          <option key={"select"}>Select Country</option>
          {apiResponse.map(country => (
            <option key={country} value={country}>{country}</option>))}
        </select>

        <table className="table table-striped col-md-10">
          <thead>
            <tr>
              <th>Year</th>
              <th>Industry Gdp</th>
              <th>Agriculture Gdp</th>
              <th>Services Gdp</th>
            </tr>
          </thead>
          <tbody>
            {"agriculture_percent_of_gdp" in countryData ?
              Object.keys(countryData["agriculture_percent_of_gdp"]).map(key => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{countryData["industry_percent_of_gdp"][key] || "N/A"}</td>
                  <td>{countryData["agriculture_percent_of_gdp"][key] || "N/A"}</td>
                  <td>{countryData["services_percent_of_gdp"][key] || "N/A"}</td>
                </tr>
              )) : null}
          </tbody>
        </table>

      </header>
    </div>
  );
}

export default App;
