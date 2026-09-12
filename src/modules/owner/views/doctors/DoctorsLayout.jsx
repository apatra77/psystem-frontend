import { Outlet } from 'react-router-dom'
import DoctorsList from './DoctorsList'

export default function DoctorsLayout() {
  return (
    <>
      <DoctorsList />
      <Outlet />
    </>
  )
}
