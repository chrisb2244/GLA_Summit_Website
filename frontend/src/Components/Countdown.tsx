import { useEffect, useState } from "react";

export type CountdownProps = {
    target: Date
}

type TimerValues = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function Countdown(props: CountdownProps) {
    const [timerVals, setTimerVals] = useState<TimerValues>({days:0,hours:0,minutes:0,seconds:0});
    useEffect(() => {
        const interval = setInterval(() => {
            const tVals = calcTimeValues(props.target);
            setTimerVals(tVals);
        }, 1000);
        return () => {
            clearInterval(interval)
        };
    }, [props.target, setTimerVals]);

    function calcTimeValues(target: Date): TimerValues {
        const now = new Date().getTime();
        let remaining = (target.getTime() - now) / 1000;
        const days = Math.floor(remaining/(3600*24));
        remaining -= (days * 3600 * 24);
        const hours = Math.floor(remaining/3600);
        remaining -= (hours * 3600)
        const minutes = Math.floor(remaining/60);
        remaining -= (minutes * 60)
        const seconds = Math.floor(remaining);
        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
        };
    }

    return (
        <div>
            <span>{timerVals.days} days, </span>
            <span>{timerVals.hours} hours, </span>
            <span>{timerVals.minutes} minutes, </span>
            <span>{timerVals.seconds} seconds</span>
        </div>
    )
}
