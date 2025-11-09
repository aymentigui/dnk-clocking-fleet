import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    iconBg?: string;
    iconColor?: string;
}

export const StatsCard = ({
    title,
    value,
    icon,
    trend,
    iconBg = "bg-primary/10",
    iconColor = "text-primary"
}: StatsCardProps) => {
    const isPositive = trend?.startsWith('+');

    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
                            {trend && (
                                <div className={cn(
                                    "flex items-center text-sm font-medium",
                                    isPositive ? "text-success" : "text-destructive"
                                )}>
                                    {isPositive ? (
                                        <TrendingUp className="h-4 w-4 mr-1" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 mr-1" />
                                    )}
                                    {trend}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "rounded-lg p-3",
                        iconBg,
                        iconColor
                    )}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
