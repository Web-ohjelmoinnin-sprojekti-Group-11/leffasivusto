import { useState, useEffect } from "react"

export function useSchedule(selectedAreaId, selectedDate) {
  const [schedule, setSchedule] = useState([])

  useEffect(() => {
    if (!selectedAreaId || !selectedDate) return

    fetch(`https://www.finnkino.fi/xml/Schedule/?area=${selectedAreaId}&dt=${selectedDate}`)
      .then((response) => response.text())
      .then((xml) => {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xml, "application/xml")
        const shows = xmlDoc.getElementsByTagName("Show")
        const tempSchedule = []

        for (let i = 0; i < shows.length; i++) {
          const show = shows[i]
          const titleNode = show.getElementsByTagName("Title")[0]
          const theatreNode = show.getElementsByTagName("Theatre")[0]
          const startNode = show.getElementsByTagName("dttmShowStart")[0]

          if (titleNode && theatreNode && startNode) {
            const [date, time] = startNode.textContent.split("T")
            const fixedTime = time.slice(0, 5)
            const [year, month, day] = date.split("-")
            const formatDate = `${day}.${month}.${year}`

            tempSchedule.push({
              title: titleNode.textContent,
              theatre: theatreNode.textContent,
              date: formatDate,
              time: fixedTime,
            })
          }
        }
        setSchedule(tempSchedule)
      })
      .catch((error) => {
        console.error("Error fetching schedule:", error)
      })
  }, [selectedAreaId, selectedDate])

  return schedule
}