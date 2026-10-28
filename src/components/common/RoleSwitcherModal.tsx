import React from 'react';
import { User, Role } from '../../types';
import { ShieldCheck, UserCheck, Check, X, ShieldAlert } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  currentUser,
  users,
  onSelectUser,
  onClose,
}) => {
  if (!isOpen) return null;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return { label: 'ເຈົ້າຂອງຮ້ານ (Owner)', desc: 'ເຂົ້າເຖິງທຸກເມນູ, ບັນຊີ, ການເງິນ, ລາຍງານ, ສິດສູງສຸດ', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };
      case 'MANAGER':
        return { label: 'ຜູ້ຈັດການ (Manager)', desc: 'ອະນຸມັດຂາຍຫຼຸດຕົ້ນທຶນ, ຄືນເງິນ, ແກ້ໄຂລາຄາ, ເບິ່ງຕົ້ນທຶນ', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' };
      case 'ADMIN':
        return { label: 'ຜູ້ດູແລລະບົບ (Admin)', desc: 'ຈັດການລະບົບ ແລະ ຕັ້ງຄ່າທັງໝົດ', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
      case 'CASHIER':
        return { label: 'ພະນັກງານຂາຍ (Cashier)', desc: 'ຈຸດຂາຍ POS, ເປີດ-ປິດກະ, ເບິ່ງສະເພາະລາຄາຂາຍ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
      case 'WAREHOUSE':
        return { label: 'ພະນັກງານສາງ (Warehouse)', desc: 'ຮັບສິນຄ້າ, ໂອນຍ້າຍສາງ, ປັບປຸງສະຕັອກ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
      default:
        return { label: role, desc: '', color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                ສະຫຼັບບົດບາດຜູ້ໃຊ້ງານ (Switch Role)
              </h3>
              <p className="text-xs text-slate-500">ເລືອກໂປຣໄຟລ໌ຜູ້ໃຊ້ເພື່ອທົດສອບລະບົບ ແລະ ສິດການເຂົ້າເຖິງ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {users.map((u) => {
            const roleInfo = getRoleBadge(u.role);
            const isSelected = u.id === currentUser.id;

            return (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${roleInfo.color}`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{roleInfo.desc}</p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600">ສະຫຼັບ</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>ໝາຍເຫດການທົດສອບສິດ:</strong> ພະນັກງານຂາຍ (Cashier) ຈະບໍ່ເຫັນຕົ້ນທຶນສິນຄ້າ ແລະ ກຳໄລສຸດທິ, ພະນັກງານສາງຈະຈັດການໄດ້ສະເພາະສະຕັອກ, ເຈົ້າຂອງຮ້ານ ແລະ ຜູ້ຈັດການສາມາດເບິ່ງ ແລະ ອະນຸມັດໄດ້ທຸກລາຍການ.
          </p>
        </div>
      </div>
    </div>
  );
};
