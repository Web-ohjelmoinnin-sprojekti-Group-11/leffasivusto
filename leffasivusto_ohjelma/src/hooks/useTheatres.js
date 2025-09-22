import { useState, useEffect } from "react"

export function useTheatres() {
  const [areas, setAreas] = useState([])

  useEffect(() => {
    fetch("https://www.finnkino.fi/xml/TheatreAreas/")
      .then((response) => response.text())
      .then((xml) => {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xml, "application/xml")
        const theaters = xmlDoc.getElementsByTagName("TheatreArea")
        const tempAreas = []

        for (let i = 0; i < theaters.length; i++) {
          tempAreas.push({
            id: theaters[i].getElementsByTagName("ID")[0].textContent,
            name: theaters[i].getElementsByTagName("Name")[0].textContent,
          })
        }
        setAreas(tempAreas)
      })
      .catch((error) => {
        console.error("Error fetching theatres:", error)
      })
  }, [])
  return areas
}