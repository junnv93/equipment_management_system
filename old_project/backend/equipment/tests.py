#equipment/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Equipment, EquipmentLoan

User = get_user_model()

class EquipmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.admin_user = User.objects.create_superuser(username='admin', password='admin123')
        self.client.force_authenticate(user=self.user)

    def test_create_equipment(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Equipment",
            "management_number": "TE-001",
            "model_name": "Test Model",
            "manufacturer": "Test Manufacturer",
            "location": "Test Location",
            "calibration_cycle": 12
        }
        response = self.client.post('/equipment/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Equipment.objects.count(), 1)
        self.assertEqual(Equipment.objects.get().name, 'Test Equipment')

    def test_list_equipment(self):
        Equipment.objects.create(name="Test Equipment", management_number="TE-001", calibration_cycle=12)
        response = self.client.get('/equipment/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_equipment(self):
        self.client.force_authenticate(user=self.admin_user)
        equipment = Equipment.objects.create(name="Old Name", management_number="ON-001", calibration_cycle=6)
        data = {"name": "New Name"}
        response = self.client.patch(f'/equipment/{equipment.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Equipment.objects.get(id=equipment.id).name, "New Name")

    def test_delete_equipment(self):
        self.client.force_authenticate(user=self.admin_user)
        equipment = Equipment.objects.create(name="To Delete", management_number="TD-001", calibration_cycle=6)
        response = self.client.delete(f'/equipment/{equipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Equipment.objects.count(), 0)

class EquipmentLoanTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='12345')
        self.client.force_authenticate(user=self.user)
        self.equipment = Equipment.objects.create(name="Test Equipment", management_number="TE-001", calibration_cycle=12)

    def test_create_loan(self):
        data = {
            "equipment": self.equipment.id,
            "borrower": self.user.id,
        }
        response = self.client.post('/loans/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EquipmentLoan.objects.count(), 1)
        self.assertEqual(EquipmentLoan.objects.get().equipment, self.equipment)

    def test_list_loans(self):
        EquipmentLoan.objects.create(equipment=self.equipment, borrower=self.user)
        response = self.client.get('/loans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

# Add more tests as needed