export class LaunchScheduler {
  private static readonly MIN_DELAY = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_DELAY = 4 * 60 * 60 * 1000; // 4 hours
  private static readonly LAUNCH_HOURS = [10, 14, 18, 22]; // UTC hours for launches

  async scheduleLaunch(): Promise<number> {
    try {
      console.log('📅 Calculating optimal launch time...');
      
      const now = new Date();
      const currentHour = now.getUTCHours();
      
      // Find next available launch hour
      let nextLaunchHour = LaunchScheduler.LAUNCH_HOURS.find(hour => hour > currentHour);
      if (!nextLaunchHour) {
        nextLaunchHour = LaunchScheduler.LAUNCH_HOURS[0]; // Roll over to next day
      }

      // Calculate base launch time
      const launchDate = new Date(now);
      launchDate.setUTCHours(nextLaunchHour, 0, 0, 0);
      if (nextLaunchHour <= currentHour) {
        launchDate.setDate(launchDate.getDate() + 1);
      }

      // Add random delay
      const randomDelay = Math.floor(
        Math.random() * (LaunchScheduler.MAX_DELAY - LaunchScheduler.MIN_DELAY) +
        LaunchScheduler.MIN_DELAY
      );
      const finalLaunchTime = launchDate.getTime() + randomDelay;

      console.log('✅ Launch scheduled for:', new Date(finalLaunchTime).toLocaleString());
      return finalLaunchTime;
    } catch (error) {
      console.error('❌ Error scheduling launch:', error);
      throw error;
    }
  }

  isValidLaunchTime(timestamp: number): boolean {
    const launchDate = new Date(timestamp);
    const launchHour = launchDate.getUTCHours();
    return LaunchScheduler.LAUNCH_HOURS.includes(launchHour);
  }

  getNextLaunchWindow(): Date {
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    let nextLaunchHour = LaunchScheduler.LAUNCH_HOURS.find(hour => hour > currentHour);
    if (!nextLaunchHour) {
      nextLaunchHour = LaunchScheduler.LAUNCH_HOURS[0];
    }

    const nextLaunch = new Date(now);
    nextLaunch.setUTCHours(nextLaunchHour, 0, 0, 0);
    if (nextLaunchHour <= currentHour) {
      nextLaunch.setDate(nextLaunch.getDate() + 1);
    }

    return nextLaunch;
  }
}