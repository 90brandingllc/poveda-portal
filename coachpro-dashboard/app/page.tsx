import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Phone,
  Calculator,
  ClipboardList,
  Search,
  Bell,
  Sun,
  Car,
  Clock,
  DollarSign,
} from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-sm rounded-r-3xl p-6 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">AutoShine Pro</h1>
          </div>

          <nav className="space-y-2">
            <div className="bg-teal-600 text-white rounded-xl px-4 py-3 flex items-center gap-3">
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </div>

            <div className="text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
              <Calendar size={20} />
              <span>Book Service</span>
            </div>

            <div className="text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
              <ClipboardList size={20} />
              <span>My Appointments</span>
            </div>

            <div className="text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
              <Phone size={20} />
              <span>Contact Us</span>
            </div>

            <div className="text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
              <Calculator size={20} />
              <span>Get Estimate</span>
            </div>

            <div className="text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
              <FileText size={20} />
              <span>My Estimates</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-teal-600 mb-2">Welcome back, Mike👋</p>
              <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <Search className="text-gray-400" size={24} />
              <Bell className="text-teal-600" size={24} />
              <Avatar>
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-800">Mike Johnson</span>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Weather */}
            <Card className="col-span-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Today's Weather</CardTitle>
                <Button variant="link" className="text-teal-600 p-0">
                  View forecast
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <Sun className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold">72°F</p>
                      <p className="text-sm text-gray-600">Sunny</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">Perfect for detailing!</p>
                    <p className="font-semibold">Low humidity: 45%</p>
                    <p className="text-sm text-gray-600">Wind: 5 mph</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments Coming Up */}
            <Card className="col-span-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
                <Button variant="link" className="text-teal-600 p-0">
                  View all appointments
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="w-8 h-8 text-teal-600" />
                      <div>
                        <p className="font-semibold">Full Detail - Honda Civic</p>
                        <p className="text-sm text-gray-600">John Smith</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">2:00 PM</p>
                      <p className="text-sm text-gray-600">Today</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">Wash & Wax - BMW X5</p>
                        <p className="text-sm text-gray-600">Sarah Davis</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">4:30 PM</p>
                      <p className="text-sm text-gray-600">Today</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estimates Table */}
            <Card className="col-span-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Estimates</CardTitle>
                <Button variant="link" className="text-teal-600 p-0">
                  View all estimates
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-sm text-gray-600 border-b">
                        <th className="text-left py-2">DATE</th>
                        <th className="text-left py-2">CUSTOMER</th>
                        <th className="text-left py-2">VEHICLE</th>
                        <th className="text-left py-2">SERVICE</th>
                        <th className="text-center py-2">AMOUNT</th>
                        <th className="text-center py-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3">Dec 15</td>
                        <td className="py-3">Michael Brown</td>
                        <td className="py-3">2022 Tesla Model 3</td>
                        <td className="py-3">Premium Detail</td>
                        <td className="text-center py-3 font-semibold">$299</td>
                        <td className="text-center py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Accepted</span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3">Dec 14</td>
                        <td className="py-3">Lisa Wilson</td>
                        <td className="py-3">2021 Audi Q7</td>
                        <td className="py-3">Interior Detail</td>
                        <td className="text-center py-3 font-semibold">$179</td>
                        <td className="text-center py-3">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3">Dec 13</td>
                        <td className="py-3">Robert Garcia</td>
                        <td className="py-3">2020 Ford F-150</td>
                        <td className="py-3">Wash & Wax</td>
                        <td className="text-center py-3 font-semibold">$89</td>
                        <td className="text-center py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Accepted</span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3">Dec 12</td>
                        <td className="py-3">Jennifer Lee</td>
                        <td className="py-3">2023 Mercedes C-Class</td>
                        <td className="py-3">Full Detail</td>
                        <td className="text-center py-3 font-semibold">$249</td>
                        <td className="text-center py-3">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Declined</span>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3">Dec 11</td>
                        <td className="py-3">David Martinez</td>
                        <td className="py-3">2019 Jeep Wrangler</td>
                        <td className="py-3">Exterior Detail</td>
                        <td className="text-center py-3 font-semibold">$149</td>
                        <td className="text-center py-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Accepted</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="col-span-4 space-y-6">
              {/* Today's Appointments */}
              <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Clock className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 font-medium">TODAY'S APPOINTMENTS</p>
                      <p className="text-3xl font-bold text-purple-800">5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card className="bg-gradient-to-br from-pink-100 to-pink-200 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                      <DollarSign className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-pink-700 font-medium">MONTHLY REVENUE</p>
                      <p className="text-3xl font-bold text-pink-800">$12.4k</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Estimates */}
              <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <FileText className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-orange-700 font-medium">PENDING ESTIMATES</p>
                      <p className="text-3xl font-bold text-orange-800">8</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Rating */}
              <Card className="bg-gradient-to-br from-teal-100 to-teal-200 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">★</span>
                    </div>
                    <div>
                      <p className="text-sm text-teal-700 font-medium">CUSTOMER RATING</p>
                      <p className="text-3xl font-bold text-teal-800">4.9</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Reminder Card */}
            <Card className="col-span-12 bg-gradient-to-r from-teal-500 to-teal-600 border-0 shadow-lg text-white overflow-hidden relative">
              <CardContent className="p-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-teal-100 mb-2">REMINDER</p>
                    <h3 className="text-3xl font-bold mb-4">
                      Schedule your next
                      <br />
                      service appointment
                    </h3>
                    <Button className="bg-white text-teal-600 hover:bg-gray-100">Book now</Button>
                  </div>
                  <div className="relative">
                    <div className="w-32 h-32 bg-white/20 rounded-full absolute -top-8 -right-8"></div>
                    <div className="w-24 h-24 bg-white/30 rounded-full absolute top-4 right-4"></div>
                    <div className="w-16 h-16 bg-white/40 rounded-full absolute top-8 right-12"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
