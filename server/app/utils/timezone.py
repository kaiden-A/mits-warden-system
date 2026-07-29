from datetime import date, datetime, timedelta, timezone

MALAYSIA_TZ = timezone(timedelta(hours=8))

def today_malaysia() -> date:
    return (datetime.now(timezone.utc) + timedelta(hours=8)).date()

def now_malaysia() -> datetime:
    return datetime.now(timezone.utc).astimezone(MALAYSIA_TZ)
