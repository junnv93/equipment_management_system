// components/EquipmentCheckout.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, Paper, Grid, Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogContent, DialogActions, DialogTitle, Snackbar,
  Autocomplete, CircularProgress, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Alert } from '@mui/material';
import { fetchEquipment, updateEquipmentStatus } from '../store/equipmentSlice';
import { fetchCheckouts, createCheckout, deleteCheckout, returnEquipment } from '../store/checkoutSlice';
import { formatDate } from '../utils/dateFormatter';
import { CHECKOUT_API } from '../api/constants';
import { useTranslation } from 'react-i18next';

const EquipmentCheckoutDialog = ({ open, onClose, onSubmit, data, setData }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('equipmentReturn')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t('returnDate')}
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={data.return_date}
          onChange={(e) => setData({ ...data, return_date: e.target.value })}
        />
        <TextField
          margin="dense"
          label={t('반입자')}
          fullWidth
          value={data.returned_to}
          onChange={(e) => setData({ ...data, returned_to: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('cancel')}
        </Button>
        <Button onClick={onSubmit} color="primary">
          {t('return')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EquipmentCheckoutDetailDialog = ({ open, onClose, data }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('checkoutReturnDetails')}</DialogTitle>
      <DialogContent>
        {data && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>{t('checkoutDate')}:</strong> {formatDate(data.checkout_date)}</Typography>
              <Typography><strong>{t('checkoutLocation')}:</strong> {data.checkout_location}</Typography>
              <Typography><strong>{t('phoneNumber')}:</strong> {data.phone_number}</Typography>
              <Typography><strong>{t('address')}:</strong> {data.address}</Typography>
              <Typography><strong>{t('checkedOutBy')}:</strong> {data.person_in_charge}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>{t('checkoutReason')}:</strong> {data.reason}</Typography>
              <Typography><strong>{t('returnDate')}:</strong> {data.return_date ? formatDate(data.return_date) : t('notReturned')}</Typography>
              <Typography><strong>{t('returnedBy')}:</strong> {data.returned_to || t('notReturned')}</Typography>
              <Typography><strong>{t('status')}:</strong> {!data.return_date ? t('checkedOut') : t('returned')}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">{t('checkedOutEquipmentList')}</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('managementNumber')}</TableCell>
                      <TableCell>{t('equipmentName')}</TableCell>
                      <TableCell>{t('model')}</TableCell>
                      <TableCell>{t('serialNumber')}</TableCell>
                      <TableCell>{t('quantity')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.checkout_equipment.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.management_number}</TableCell>
                        <TableCell>{item.equipment_name}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>{item.serial_number}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function EquipmentCheckout() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const equipment = useSelector(state => state.equipment.items);
  const checkouts = useSelector(state => state.checkout.items);
  const [loading, setLoading] = useState(false);
  const [newCheckout, setNewCheckout] = useState({
    checkout_location: '',
    phone_number: '',
    address: '',
    reason: '',
    checkout_date: '',
    person_in_charge: '',
    checkout_equipment: [{ management_number: '', equipment: null, model: '', serial_number: '', quantity: 1 }]
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [returnData, setReturnData] = useState({
    return_date: '',
    returned_to: ''
  });
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCheckoutDetail, setSelectedCheckoutDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchEquipment());
    dispatch(fetchCheckouts());
  }, [dispatch]);

  const validateForm = useCallback(() => {
    if (!newCheckout.checkout_location.trim()) return false;
    if (!newCheckout.phone_number.trim()) return false;
    if (!newCheckout.address.trim()) return false;
    if (!newCheckout.reason.trim()) return false;
    if (!newCheckout.checkout_date) return false;
    if (!newCheckout.person_in_charge.trim()) return false;
    if (newCheckout.checkout_equipment.length === 0) return false;
    for (let item of newCheckout.checkout_equipment) {
      if (!item.management_number || !item.equipment || item.quantity < 1) return false;
    }
    return true;
  }, [newCheckout]);

  const validateDates = useCallback((checkoutDate, returnDate) => {
    const checkout = new Date(checkoutDate);
    const return_ = returnDate ? new Date(returnDate) : null;
  
    if (return_ && return_ < checkout) {
      return t('returnBeforeCheckoutError');
    }
    return null;
  }, [t]);

  const validateQuantity = useCallback((requestedQuantity) => {
    return requestedQuantity === 1;
  }, []);

  const handleCheckout = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) {
      setSnackbar({ open: true, message: t('formValidationError'), severity: 'error' });
      return;
    }

    const dateError = validateDates(newCheckout.checkout_date, null);
    if (dateError) {
      setSnackbar({ open: true, message: dateError, severity: 'error' });
      return;
    }

    for (let item of newCheckout.checkout_equipment) {
      const equipmentItem = equipment.find(eq => eq.id === item.equipment);
      
      console.log('Selected equipment:', equipmentItem);
      console.log('Requested quantity:', item.quantity);
  
      if (equipmentItem && !['available', 'calibration_soon'].includes(equipmentItem.status)) {
        setSnackbar({ open: true, message: t('equipmentNotAvailable', { name: equipmentItem.name }), severity: 'error' });
        return;
      }
      if (item.quantity !== 1) {
        setSnackbar({ open: true, message: t('invalidQuantity', { name: equipmentItem.name }), severity: 'error' });
        return;
      }
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      const existingCheckout = checkouts.find(
        checkout => checkout.checkout_date === newCheckout.checkout_date && 
                    checkout.checkout_location === newCheckout.checkout_location
      );

      let response;
      if (existingCheckout) {
        response = await fetch(`${CHECKOUT_API}${existingCheckout.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            checkout_equipment: [...existingCheckout.checkout_equipment, ...newCheckout.checkout_equipment]
          })
        });
      } else {
        response = await fetch(CHECKOUT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(newCheckout)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      dispatch(createCheckout(data));
      newCheckout.checkout_equipment.forEach(item => {
        dispatch(updateEquipmentStatus({ id: item.equipment, status: 'checked_out' }));
      });
      setSnackbar({ open: true, message: t('checkoutSuccess'), severity: 'success' });
      setNewCheckout({
        checkout_location: '',
        phone_number: '',
        address: '',
        reason: '',
        checkout_date: '',
        person_in_charge: '',
        checkout_equipment: [{ management_number: '', equipment: null, model: '', serial_number: '', quantity: 1 }]
      });
      dispatch(fetchCheckouts());
    } catch (error) {
      console.error('Error creating checkout:', error);
      setSnackbar({ open: true, message: t('checkoutError', { error: error.message }), severity: 'error' });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [newCheckout, dispatch, checkouts, isSubmitting, validateForm, validateDates, equipment, t]);

  const handleReturn = useCallback(async () => {
    if (selectedCheckout.return_date) {
      setSnackbar({ open: true, message: t('alreadyReturned'), severity: 'error' });
      return;
    }

    const dateError = validateDates(selectedCheckout.checkout_date, returnData.return_date);
    if (dateError) {
      setSnackbar({ open: true, message: dateError, severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${CHECKOUT_API}${selectedCheckout.id}/return_equipment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(returnData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      dispatch(returnEquipment({ id: selectedCheckout.id, returnData }));
      dispatch(fetchCheckouts());
      dispatch(fetchEquipment());
      setSnackbar({ open: true, message: t('반입성공'), severity: 'success' });
      setOpenDialog(false);
    } catch (error) {
      console.error('Error returning equipment:', error);
      setSnackbar({ open: true, message: t('returnError', { error: error.message }), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedCheckout, returnData, dispatch, validateDates, t]);

  const handleAddEquipment = useCallback(() => {
    setNewCheckout(prev => ({
      ...prev,
      checkout_equipment: [...prev.checkout_equipment, { management_number: '', equipment: null, model: '', serial_number: '', quantity: 1 }]
    }));
  }, []);

  const handleRemoveEquipment = useCallback((index) => {
    setNewCheckout(prev => ({
      ...prev,
      checkout_equipment: prev.checkout_equipment.filter((_, i) => i !== index)
    }));
  }, []);

  const handleEquipmentChange = useCallback((index, field, value) => {
    setNewCheckout(prev => {
      const newEquipment = [...prev.checkout_equipment];
      if (field === 'management_number') {
        const selectedEquipment = equipment.find(eq => eq.management_number === value);
        if (selectedEquipment) {
          const isAlreadySelected = prev.checkout_equipment.some(
            item => item.equipment === selectedEquipment.id && item !== newEquipment[index]
          );
          if (isAlreadySelected) {
            return prev;
          }
          if (!['available', 'calibration_soon'].includes(selectedEquipment.status)) {
            setSnackbar({ open: true, message: t('equipmentNotAvailable', { name: selectedEquipment.name }), severity: 'warning' });
            return prev;
          }
          newEquipment[index] = {
            management_number: selectedEquipment.management_number,
            equipment: selectedEquipment.id,
            model: selectedEquipment.model_name,
            serial_number: selectedEquipment.serial_number,
            quantity: 1
          };
        }
      } else if (field === 'quantity') {
        // 수량 변경을 허용하지 않음
        setSnackbar({ open: true, message: t('quantityChangeNotAllowed'), severity: 'warning' });
        return prev;
      } else {
        newEquipment[index][field] = value;
      }
      return { ...prev, checkout_equipment: newEquipment };
    });
  }, [equipment, t]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewCheckout(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleYearChange = (event) => {
    setSelectedYear(Number(event.target.value));
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(Number(event.target.value));
  };

  const filteredCheckouts = useMemo(() => {
    return checkouts.filter(checkout => {
      const checkoutDate = new Date(checkout.checkout_date);
      return checkoutDate.getFullYear() === selectedYear && 
             checkoutDate.getMonth() + 1 === selectedMonth &&
             !checkout.return_date;
    }).sort((a, b) => new Date(b.checkout_date) - new Date(a.checkout_date));
  }, [checkouts, selectedYear, selectedMonth]);

  const handleDetailView = (checkout) => {
    setSelectedCheckoutDetail(checkout);
    setDetailDialogOpen(true);
  };

  const handleDeleteCheckout = async (id) => {
    if (window.confirm(t('confirmDeleteCheckout'))) {
      try {
        await dispatch(deleteCheckout(id)).unwrap();
        setSnackbar({ open: true, message: t('deleteCheckoutSuccess'), severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: t('deleteCheckoutError'), severity: 'error' });
      }
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>{t('장비 반출입 대장')}</Typography>
        
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('반출지')}
            name="checkout_location"
            value={newCheckout.checkout_location}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('전화번호')}
            name="phone_number"
            value={newCheckout.phone_number}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('주소')}
            name="address"
            value={newCheckout.address}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('반출 사유')}
            name="reason"
            multiline
            rows={4}
            value={newCheckout.reason}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('반출일자')}
            name="checkout_date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={newCheckout.checkout_date}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('반출자')}
            name="person_in_charge"
            value={newCheckout.person_in_charge}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" style={{ marginTop: 16 }}>{t('반출장비')}</Typography>
      {newCheckout.checkout_equipment.map((item, index) => (
        <Grid container spacing={2} key={index} style={{ marginTop: 8 }}>
          <Grid item xs={2}>
            <Autocomplete
              options={equipment}
              getOptionLabel={(option) => option.management_number}
              value={equipment.find(eq => eq.management_number === item.management_number) || null}
              onChange={(e, newValue) => handleEquipmentChange(index, 'management_number', newValue ? newValue.management_number : null)}
              renderInput={(params) => <TextField {...params} label={t('관리번호')} />}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              fullWidth
              label={t('장비명')}
              value={item.equipment ? equipment.find(eq => eq.id === item.equipment).name : ''}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              fullWidth
              label={t('모델명')}
              value={item.model}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              fullWidth
              label={t('일련번호')}
              value={item.serial_number}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              fullWidth
              label={t('quantity')}
              value={1}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button onClick={() => handleRemoveEquipment(index)}>{t('제거')}</Button>
          </Grid>
        </Grid>
      ))}
      <Button onClick={handleAddEquipment} style={{ marginTop: 8 }}>{t('장비추가')}</Button>

      <Button variant="contained" color="primary" onClick={handleCheckout} style={{ marginTop: 16 }}>
        {t('반출')}
      </Button>

      <Typography variant="h6" style={{ marginTop: 24 }}>{t('반출입목록')}</Typography>
      <Grid container spacing={2} style={{ marginBottom: 16 }}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>{t('selectYear')}</InputLabel>
            <Select value={selectedYear} onChange={handleYearChange}>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <MenuItem key={year} value={year}>{year}{t('년')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>{t('selectMonth')}</InputLabel>
            <Select value={selectedMonth} onChange={handleMonthChange}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <MenuItem key={month} value={month}>{month}{t('월')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('반출일자')}</TableCell>
              <TableCell>{t('반출지')}</TableCell>
              <TableCell>{t('반입일자')}</TableCell>
              <TableCell>{t('상태')}</TableCell>
              <TableCell>{t('작업')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCheckouts.map((checkout) => (
              <TableRow key={checkout.id}>
                <TableCell>{formatDate(checkout.checkout_date)}</TableCell>
                <TableCell>{checkout.checkout_location}</TableCell>
                <TableCell>{checkout.return_date ? formatDate(checkout.return_date) : '-'}</TableCell>
                <TableCell>
                  {!checkout.return_date ? t('반출') : t('반입')}
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleDetailView(checkout)}>
                    {t('상세보기')}
                  </Button>
                  {!checkout.return_date && (
                    <Button onClick={() => {
                      setSelectedCheckout(checkout);
                      setOpenDialog(true);
                    }}>
                      {t('반입')}
                    </Button>
                  )}
                  <Button onClick={() => handleDeleteCheckout(checkout.id)} color="secondary">
                    {t('삭제')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EquipmentCheckoutDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleReturn}
        data={returnData}
        setData={setReturnData}
      />

      <EquipmentCheckoutDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        data={selectedCheckoutDetail}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default EquipmentCheckout;