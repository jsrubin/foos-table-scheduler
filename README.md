# foos-table-scheduler
A foosball table reservation app. UI is built using React for a 3.5" touch screen display running on a raspberry pi.

# REST calls
- **bold**GET/available**bold** - is table available
- GET/available?starttime=1469978100000 - is table available
- POST/schedule?reserve=15 - reserve table now for 15 minutes
- POST/schedule?reserve=15&starttime=1469978100000 - reserve table at give time for 15 minutes
- PUT/extend&reserve=15 - add 15 minutes to current reservation
- DELETE/cancel - end active reservation
- DELETE/cancel?starttime=1469978100000 - cancel reservation for a given time

# UI
- display upcoming reservations
- reserve table 15/30/45

# Run Unit tests
npm test