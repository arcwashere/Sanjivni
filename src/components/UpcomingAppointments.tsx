import { Construction } from "lucide-react";

const UpcomingAppointments = () => {
  return (
    <section>
      <h2 className="section-title mb-3">Upcoming Appointments</h2>
      <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Construction className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Coming Soon</p>
          <p className="text-xs text-muted-foreground mt-1">
            Appointment tracking is an upcoming feature
          </p>
        </div>
      </div>
    </section>
  );
};

export default UpcomingAppointments;
