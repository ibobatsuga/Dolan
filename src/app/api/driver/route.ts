import { NextRequest, NextResponse } from 'next/server';
import { getStore, updateDriverTripStatus } from '@/lib/store';
import { DriverAssignment } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get('driverId') || 'drv-bagus';
  const store = getStore();

  const driver = store.drivers.find((d) => d.id === driverId) ?? store.drivers[0];
  const assignments = store.assignments.filter((a) => a.driverId === driver.id);

  // FR-MIT-09: Driver view ONLY exposes schedule, pickup point, guest contact, and package fuel boundary.
  // Partner financial figures (commission, payouts, rates) are explicitly stripped!
  const tasks = assignments.map((asg) => {
    const booking = store.bookings.find((b) => b.code === asg.bookingId);
    const vehicle = booking
      ? store.vehicles.find((v) => v.id === booking.vehicleId)
      : undefined;
    return {
      assignment: asg,
      bookingCode: booking?.code,
      startAt: booking?.startAt,
      endAt: booking?.endAt,
      durationHours: booking?.durationHours,
      pickupLocationName: booking?.pickupLocationName,
      renterName: booking?.renterName,
      renterPhone: booking?.renterPhone,
      packageType: booking?.packageType,
      packageSnapshot: booking?.packageSnapshot,
      vehicleName: vehicle?.brandModel,
      plateMasked: vehicle?.plateMasked,
    };
  });

  return NextResponse.json({
    driver,
    allDrivers: store.drivers,
    tasks,
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    assignmentId: string;
    status: DriverAssignment['status'];
  };
  const updated = updateDriverTripStatus(body);
  if (!updated) {
    return NextResponse.json({ error: 'Tugas sopir tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json({ updated });
}
