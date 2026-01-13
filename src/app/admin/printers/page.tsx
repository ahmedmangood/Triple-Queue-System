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
import { Plus, Edit, Trash2, Printer, TestTube, Wifi, Usb } from 'lucide-react'

interface Printer {
  id: string
  name: string
  type: 'USB' | 'NETWORK'
  address?: string
  port?: number
  paperWidth: number
  isActive: boolean
  testPrintResult?: string
  createdAt: string
  updatedAt: string
}

interface Service {
  id: string
  name: string
  code: string
}

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'USB' as Printer['type'],
    address: '',
    port: 9100,
    paperWidth: 80,
    isActive: true
  })

  useEffect(() => {
    fetchPrinters()
    fetchServices()
  }, [])

  const fetchPrinters = async () => {
    try {
      const response = await fetch('/api/admin/printers')
      if (response.ok) {
        const data = await response.json()
        setPrinters(data)
      }
    } catch (error) {
      console.error('Error fetching printers:', error)
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
      const url = editingPrinter 
        ? `/api/admin/printers/${editingPrinter.id}`
        : '/api/admin/printers'
      
      const method = editingPrinter ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchPrinters()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save printer')
      }
    } catch (error) {
      console.error('Error saving printer:', error)
      alert('Failed to save printer')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'USB',
      address: '',
      port: 9100,
      paperWidth: 80,
      isActive: true
    })
    setEditingPrinter(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (printer: Printer) => {
    setEditingPrinter(printer)
    setFormData({
      name: printer.name,
      type: printer.type,
      address: printer.address || '',
      port: printer.port || 9100,
      paperWidth: printer.paperWidth,
      isActive: printer.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this printer?')) {
      try {
        const response = await fetch(`/api/admin/printers/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchPrinters()
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to delete printer')
        }
      } catch (error) {
        console.error('Error deleting printer:', error)
        alert('Failed to delete printer')
      }
    }
  }

  const handleTestPrint = async (id: string) => {
    setIsTesting(id)
    try {
      const response = await fetch(`/api/admin/printers/${id}/test`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        alert('Test print sent successfully!')
        
        // Update the test print result
        await fetchPrinters()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send test print')
      }
    } catch (error) {
      console.error('Error testing printer:', error)
      alert('Failed to send test print')
    } finally {
      setIsTesting(null)
    }
  }

  const togglePrinterStatus = async (id: string) => {
    try {
      const printer = printers.find(p => p.id === id)
      if (!printer) return

      const response = await fetch(`/api/admin/printers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !printer.isActive }),
      })

      if (response.ok) {
        await fetchPrinters()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update printer status')
      }
    } catch (error) {
      console.error('Error updating printer status:', error)
      alert('Failed to update printer status')
    }
  }

  const getPrinterIcon = (type: Printer['type']) => {
    return type === 'NETWORK' ? <Wifi className="h-4 w-4" /> : <Usb className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Printer Configuration</h1>
          <p className="text-gray-600 mt-2">
            Manage printers and assign them to services
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPrinter(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Printer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
              </DialogTitle>
              <DialogDescription>
                {editingPrinter ? 'Update the printer configuration below.' : 'Configure a new printer for ticket printing.'}
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
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: Printer['type']) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USB">USB</SelectItem>
                      <SelectItem value="NETWORK">Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === 'NETWORK' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right">
                        IP Address
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="col-span-3"
                        placeholder="192.168.1.100"
                        required={formData.type === 'NETWORK'}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="port" className="text-right">
                        Port
                      </Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 9100 }))}
                        className="col-span-3"
                        required={formData.type === 'NETWORK'}
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paperWidth" className="text-right">
                    Paper Width (mm)
                  </Label>
                  <Select 
                    value={formData.paperWidth.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paperWidth: parseInt(value) }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58">58mm</SelectItem>
                      <SelectItem value="80">80mm</SelectItem>
                      <SelectItem value="112">112mm</SelectItem>
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
                  {editingPrinter ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Printers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Printers</CardTitle>
          <CardDescription>
            A list of all configured printers in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Printer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Paper Width</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printers.map((printer) => (
                <TableRow key={printer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Printer className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{printer.name}</p>
                        {printer.testPrintResult && (
                          <p className="text-xs text-green-600">
                            Last test: {new Date(printer.testPrintResult).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPrinterIcon(printer.type)}
                      <Badge variant="outline">{printer.type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {printer.type === 'NETWORK' ? (
                      <div className="text-sm">
                        <p>{printer.address}</p>
                        <p className="text-gray-500">Port: {printer.port}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Local USB</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{printer.paperWidth}mm</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={printer.isActive ? "default" : "secondary"}
                      className={printer.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {printer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestPrint(printer.id)}
                        disabled={isTesting === printer.id || !printer.isActive}
                      >
                        {isTesting === printer.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(printer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrinterStatus(printer.id)}
                      >
                        {printer.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(printer.id)}
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
          
          {printers.length === 0 && (
            <div className="text-center py-8">
              <Printer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No printers configured</p>
              <p className="text-sm text-gray-500">Add your first printer to start printing tickets</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printer Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Printer Setup Guide</CardTitle>
          <CardDescription>
            Learn how to configure different types of printers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Usb className="h-4 w-4" />
                USB Printers
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Connect printer to computer via USB</li>
                <li>• Install printer drivers if required</li>
                <li>• Select "USB" as printer type</li>
                <li>• Test connection with Test Print button</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Network Printers
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ensure printer is connected to network</li>
                <li>• Find printer IP address</li>
                <li>• Enter IP and port (default: 9100)</li>
                <li>• Test connection with Test Print button</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}