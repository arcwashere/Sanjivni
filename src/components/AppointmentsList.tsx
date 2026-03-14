import { Calendar, Construction } from "lucide-react";

const AppointmentsList = () => {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Appointment scheduling and tracking is an upcoming feature. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default AppointmentsList;
