"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Check, Upload, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignupWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    logo: null as File | null,
  })

  const totalSteps = 3

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, logo: e.target.files[0] })
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipBranding = () => {
    setCurrentStep(3)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
            {currentStep > 1 && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 px-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <div className={`h-0.5 w-4 ${index < currentStep ? "bg-primary" : "bg-slate-200"}`} />}
                <div
                  className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                    index + 1 === currentStep
                      ? "bg-primary text-white"
                      : index + 1 < currentStep
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {index + 1 < currentStep ? <Check className="h-3 w-3" /> : index + 1}
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 mt-2 text-sm">
            {currentStep === 1 && "Let's get started with your basic information"}
            {currentStep === 2 && "Set up your brand identity"}
            {currentStep === 3 && "You're all set to start using the platform"}
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a secure password"
                    className="pl-10"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">Must be at least 8 characters</p>
              </div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign up with Google (Coming Soon)
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Your name or business name"
                  value={formData.displayName}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-slate-500">This will appear on client-facing pages</p>
              </div>

              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                  {formData.logo ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-900">{formData.logo.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, logo: null })}
                        className="mt-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-500">Drag and drop or click to upload</p>
                      <p className="text-xs text-slate-400">SVG, PNG, or JPG (max. 2MB)</p>
                      <Input id="logo" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      <Button variant="outline" size="sm" onClick={() => document.getElementById("logo")?.click()}>
                        Select file
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="py-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
              <p className="text-slate-500 mb-6">
                Your account has been created successfully. You can now start using the platform to manage your creative
                projects.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {currentStep === 1 && (
            <Button className="w-full" onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {currentStep === 2 && (
            <>
              <Button className="w-full" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full" onClick={skipBranding}>
                Skip branding setup
              </Button>
            </>
          )}

          {currentStep === 3 && (
            <Button className="w-full" onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
