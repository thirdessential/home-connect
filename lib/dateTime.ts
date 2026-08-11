export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export function calculateTimeToDate(targetDate: string): string {
    const now = new Date();
    const target = new Date(targetDate);

    // Reset time parts to compare just the dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    // If it's the same day, return 'Today'
    if (today.getTime() === targetDay.getTime()) {
        return 'Today';
    }

    // Calculate the difference in milliseconds
    const diffMs = target.getTime() - now.getTime();
    if (diffMs < 0) return 'Expired';

    // Calculate total days remaining
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If more than 3 days remaining, show days
    if (totalDays > 3) {
        return `${totalDays} day${totalDays === 1 ? '' : 's'}`;
    }

    // 3 days or less remaining, show in HH:MM format
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Format with leading zeros
    const formattedHours = totalHours.toString().padStart(2, '0');
    const formattedMinutes = totalMinutes.toString().padStart(2, '0');
    return `${formattedHours}h : ${formattedMinutes}m`;
}

export function formatToReadableDate(isoString: string): string {
    const date = new Date(isoString);
    // Array of month names
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Function to add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (day: number): string => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
}

export const formatPostTime = (timestamp: string | number | Date): string => {
    // Robustly parse dates, including plain 'YYYY-MM-DD' format
    let date: Date;
    if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === "string") {
        const ymdOnly = /^\d{4}-\d{2}-\d{2}$/;
        if (ymdOnly.test(timestamp)) {
            // Construct using local time to avoid timezone shifts
            const [y, m, d] = timestamp.split("-").map((n) => parseInt(n, 10));
            date = new Date(y, (m || 1) - 1, d || 1);
        } else {
            date = new Date(timestamp);
        }
    } else {
        date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future timestamps (return positive time without the "ago" suffix)
    if (diffMs < 0) {
        const futureMs = Math.abs(diffMs);
        const minutes = Math.floor(futureMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 10) {
            const day = date.getDate();
            const month = date.toLocaleString("en-US", { month: "short" });
            const year = date.getFullYear().toString().slice(-2);
            const daySuffix =
                day % 10 === 1 && day !== 11
                    ? "st"
                    : day % 10 === 2 && day !== 12
                        ? "nd"
                        : day % 10 === 3 && day !== 13
                            ? "rd"
                            : "th";
            return `${day}${daySuffix} ${month} ${year}`;
        }
        if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;
        if (hours >= 1) return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
        if (minutes >= 1) return `${minutes} min left`;
        return "just now";
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Past timestamps
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 10) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

    // After 10 days, show date
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    const daySuffix =
        day % 10 === 1 && day !== 11
            ? "st"
            : day % 10 === 2 && day !== 12
                ? "nd"
                : day % 10 === 3 && day !== 13
                    ? "rd"
                    : "th";

    return `${day}${daySuffix} ${month} ${year}`;
};

// Formats separate date (YYYY-MM-DD) and time (HH:mm) into
// "Sunday, 10 Aug at 11:00 AM" style for display
export function formatEventDateTime(dateStr?: string, timeStr?: string): string {
    if (!dateStr) return "";
    // Parse date parts safely using local time to avoid TZ shifts
    const ymd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
    const hm = /^([0-9]{1,2}):([0-9]{2})$/;

    const dm = ymd.exec(dateStr);
    if (!dm) return "";
    const year = parseInt(dm[1], 10);
    const month = parseInt(dm[2], 10) - 1; // 0-based
    const day = parseInt(dm[3], 10);

    let hours = 0;
    let minutes = 0;
    if (typeof timeStr === "string") {
        const tm = hm.exec(timeStr.trim());
        if (tm) {
            hours = Math.max(0, Math.min(23, parseInt(tm[1], 10)));
            minutes = Math.max(0, Math.min(59, parseInt(tm[2], 10)));
        }
    }

    const dt = new Date(year, month, day, hours, minutes, 0, 0);
    if (isNaN(dt.getTime())) return "";

    const weekday = dt.toLocaleDateString("en-IN", { weekday: "long" });
    const monthShort = dt.toLocaleDateString("en-IN", { month: "short" });
    const dayNum = dt.getDate();
    let time = dt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
    // Normalize AM/PM to uppercase without seconds
    time = time.replace(/\s*([ap])\.m\./i, (_, p1) => ` ${p1.toUpperCase()}M`).replace(/ am| pm/i, (m) => m.toUpperCase());

    return `${weekday}, ${dayNum} ${monthShort} at ${time}`;
}

export const formatDateComment = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
};