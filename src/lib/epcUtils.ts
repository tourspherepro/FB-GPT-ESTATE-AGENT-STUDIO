
export const safeParseInt = (value: string | number | undefined | null): number => {
    if (value === null || value === undefined) return 0;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? 0 : parsed;
};

const ratingBands = [
    { rating: 'A', color: 'bg-green-600', textColor: 'text-white' },
    { rating: 'B', color: 'bg-green-500', textColor: 'text-white' },
    { rating: 'C', color: 'bg-yellow-400', textColor: 'text-slate-800' },
    { rating: 'D', color: 'bg-yellow-500', textColor: 'text-slate-800' },
    { rating: 'E', color: 'bg-orange-500', textColor: 'text-white' },
    { rating: 'F', color: 'bg-orange-600', textColor: 'text-white' },
    { rating: 'G', color: 'bg-red-600', textColor: 'text-white' },
];

export const getRatingColor = (rating: string, forCell: boolean = false): string => {
    const band = ratingBands.find(b => b.rating === rating);
    if (!band) return forCell ? '#cccccc' : 'bg-slate-300';
    
    if (forCell) {
        // recharts Cell component needs a hex/rgb value, not a tailwind class
        switch(rating) {
            case 'A': return '#16a34a'; // green-600
            case 'B': return '#22c55e'; // green-500
            case 'C': return '#facc15'; // yellow-400
            case 'D': return '#eab308'; // yellow-500
            case 'E': return '#f97316'; // orange-500
            case 'F': return '#ea580c'; // orange-600
            case 'G': return '#dc2626'; // red-600
            default: return '#cccccc';
        }
    }
    
    return band.color;
};

export const getRatingTextColor = (rating: string): string => {
    const band = ratingBands.find(b => b.rating === rating);
    return band ? band.textColor : 'text-slate-800';
};
