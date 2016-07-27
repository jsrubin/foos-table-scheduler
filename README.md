# foos-table-scheduler
A nodejs UI and RESTful services for scheduling and reserving a foosball table.

# REST calls
GET/available - is table available
POST/schedule&reserve=15&starttime=123456 - reserve table at give time for 15 minutes
POST/schedule&reserve=15 - reserve table now for 15 minutes
PUT/extend&reserve=15 - add 15 minutes to current reservation
DELETE/cancel - end active reservation

# UI
display upcoming reservations
reserve table 15/30/45
