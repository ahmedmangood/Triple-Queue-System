'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Settings, Printer } from 'lucide-react'

interface Service {
  id: string
  name: string
  code: string
  color: string
  description?: string
  isActive: boolean
  currentNumber: number
  printer?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#3B82F6',
    description: '',
    isActive: true,
    printerId: 'none'
  })

  // Fetch services from API
  useEffect(() => {
    fetchServices()
  }, [])

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
      const url = editingService 
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services'
      
      const method = editingService ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (response.ok) {
        await fetchServices()
        resetForm()
      } else {
        alert(responseData.error || 'Failed to save service')
      }
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Failed to save service')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      color: '#3B82F6',
      description: '',
      isActive: true,
      printerId: 'none'
    })
    setEditingService(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      code: service.code,
      color: service.color,
      description: service.description || '',
      isActive: service.isActive,
      printerId: service.printer?.id || 'none'
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await fetch(`/api/admin/services/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchServices()
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to delete service')
        }
      } catch (error) {
        console.error('Error deleting service:', error)
        alert('Failed to delete service')
      }
    }
  }

  const handleResetCounter = async (id: string) => {
    if (confirm('Are you sure you want to reset the counter for this service?')) {
      try {
        const response = await fetch(`/api/admin/services/${id}/reset-counter`, {
          method: 'POST',
        })

        if (response.ok) {
          await fetchServices()
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to reset counter')
        }
      } catch (error) {
        console.error('Error resetting counter:', error)
        alert('Failed to reset counter')
      }
    }
  }

  const toggleServiceStatus = async (id: string) => {
    try {
      const service = services.find(s => s.id === id)
      if (!service) return

      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !service.isActive }),
      })

      if (response.ok) {
        await fetchServices()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update service status')
      }
    } catch (error) {
      console.error('Error updating service status:', error)
      alert('Failed to update service status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-2">
            Manage customer services and their configurations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingService(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Update the service details below.' : 'Create a new service for customers.'}
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
                  <Label htmlFor="code" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="col-span-3"
                    maxLength={1}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="printer" className="text-right">
                    Printer
                  </Label>
                  <Select value={formData.printerId} onValueChange={(value) => setFormData(prev => ({ ...prev, printerId: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No printer</SelectItem>
                      <SelectItem value="1">Main Printer</SelectItem>
                      <SelectItem value="2">Tech Printer</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {editingService ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>
            A list of all services in your queue management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Number</TableHead>
                <TableHead>Printer</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: service.color }}
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{service.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={service.isActive ? "default" : "secondary"}
                      className={service.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{service.currentNumber.toString().padStart(3, '0')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetCounter(service.id)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.printer ? (
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        <span className="text-sm">{service.printer.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No printer</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id)}
                      >
                        {service.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
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