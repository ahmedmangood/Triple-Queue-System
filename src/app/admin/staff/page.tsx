'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Key, Users } from 'lucide-react'

interface Staff {
  id: string
  username: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPERVISOR' | 'STAFF' | 'KIOSK'
  counterNumber?: number
  isActive: boolean
  services: Array<{
    id: string
    name: string
    code: string
  }>
  createdAt: string
  updatedAt: string
}

interface Service {
  id: string
  name: string
  code: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'STAFF' as Staff['role'],
    counterNumber: '' as string,
    isActive: true,
    serviceIds: [] as string[]
  })

  // Fetch staff and services from API
  useEffect(() => {
    fetchStaff()
    fetchServices()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingStaff 
        ? `/api/admin/staff/${editingStaff.id}`
        : '/api/admin/staff'
      
      const method = editingStaff ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchStaff()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save staff member')
      }
    } catch (error) {
      console.error('Error saving staff member:', error)
      alert('Failed to save staff member')
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'STAFF',
      counterNumber: '',
      isActive: true,
      serviceIds: []
    })
    setEditingStaff(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      username: staffMember.username,
      name: staffMember.name,
      email: staffMember.email,
      password: '',
      role: staffMember.role,
      counterNumber: staffMember.counterNumber?.toString() || '',
      isActive: staffMember.isActive,
      serviceIds: staffMember.services.map(s => s.id)
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await fetch(`/api/admin/staff/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchStaff()
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to delete staff member')
        }
      } catch (error) {
        console.error('Error deleting staff member:', error)
        alert('Failed to delete staff member')
      }
    }
  }

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Enter new password:')
    if (!newPassword) return

    try {
      const response = await fetch(`/api/admin/staff/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        alert('Password reset successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Failed to reset password')
    }
  }

  const toggleStaffStatus = async (id: string) => {
    try {
      const staffMember = staff.find(s => s.id === id)
      if (!staffMember) return

      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !staffMember.isActive }),
      })

      if (response.ok) {
        await fetchStaff()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update staff status')
      }
    } catch (error) {
      console.error('Error updating staff status:', error)
      alert('Failed to update staff status')
    }
  }

  const getRoleBadgeVariant = (role: Staff['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'SUPERVISOR':
        return 'default'
      case 'STAFF':
        return 'secondary'
      case 'KIOSK':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">
            Manage staff accounts, roles, and service assignments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingStaff(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </DialogTitle>
              <DialogDescription>
                {editingStaff ? 'Update the staff member details below.' : 'Create a new staff account.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="col-span-3"
                    required={!editingStaff}
                    placeholder={editingStaff ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value: Staff['role']) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="KIOSK">Kiosk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="counterNumber" className="text-right">
                    Counter Number
                  </Label>
                  <Input
                    id="counterNumber"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.counterNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, counterNumber: e.target.value }))}
                    className="col-span-3"
                    placeholder="Optional: Assign counter number"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="services" className="text-right">
                    Services
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={formData.serviceIds.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ 
                                ...prev, 
                                serviceIds: [...prev.serviceIds, service.id] 
                              }))
                            } else {
                              setFormData(prev => ({ 
                                ...prev, 
                                serviceIds: prev.serviceIds.filter(id => id !== service.id) 
                              }))
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`service-${service.id}`} className="text-sm">
                          {service.name} ({service.code})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">
                    Active
                  </Label>
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
          <CardDescription>
            A list of all staff members in your queue management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Counter</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{staffMember.name}</p>
                      <p className="text-sm text-gray-500">{staffMember.email}</p>
                      <p className="text-xs text-gray-400">@{staffMember.username}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(staffMember.role)}>
                      {staffMember.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {staffMember.counterNumber ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Counter {staffMember.counterNumber}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {staffMember.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staffMember.services.map((service) => (
                          <Badge key={service.id} variant="outline" className="text-xs">
                            {service.code}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No services</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={staffMember.isActive ? "default" : "secondary"}
                      className={staffMember.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {staffMember.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(staffMember)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(staffMember.id)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStaffStatus(staffMember.id)}
                      >
                        {staffMember.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(staffMember.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}