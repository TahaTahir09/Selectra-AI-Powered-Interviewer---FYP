import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: boolean;
}

const StatsCard = ({ title, value, icon: Icon, gradient }: StatsCardProps) => {
  return (
    <Card className={gradient ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${gradient ? "bg-gradient-to-br from-primary to-accent" : "bg-muted"}`}>
            <Icon className={`h-6 w-6 ${gradient ? "text-white" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
