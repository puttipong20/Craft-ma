/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  Flex,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { useState, useContext, useEffect } from "react";
import moment from "moment";
import { useForm, Controller } from "react-hook-form";
// import { useState } from "react";
// import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
// import { db } from '../../services/config-db';
// import { CompanyDetail } from '../../@types/Type';

import { TiDocumentText } from "react-icons/ti";
import { MA } from "../../@types/Type";
import { doc, addDoc, collection } from "firebase/firestore";
import { db } from "../../services/config-db";

import { AuthContext } from "../../context/AuthContext";

interface Props {
  companyId?: string;
  projectId: string;
  activeMA?: MA;
  MAlog: { id: string; ma: MA }[];
  callBack: () => void;
}

const Renewal: React.FC<Props> = (props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { handleSubmit, control, reset, watch } = useForm();
  const [isUpdate, setIsUpdate] = useState(false);
  const [duration, setDuration] = useState(0);
  const toast = useToast();
  const logs = props.MAlog.filter(
    (ma) => ma.ma.status === "active" || ma.ma.status === "advance"
  );
  const currentDate = moment().format("YYYY-MM-DD");
  const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
  const Auth = useContext(AuthContext);

  const checkTimeOverlap = (s1: string, e1: string, s2: string, e2: string) => {
    const start1 = new Date(s1);
    const start2 = new Date(s2);
    const end1 = new Date(e1);
    const end2 = new Date(e2);

    if (start1 <= end2 && end1 >= start2) {
      return true;
    } else {
      return false;
    }
  };

  const startMA = watch("renewStart") || moment().format("YYYY-MM-DD");
  const endMA =
    watch("renewEnd") || moment().add(1, "year").format("YYYY-MM-DD");

  const durationData = (startDate: string, endDate: string) => {
    const a = new Date(startDate) as any;
    const b = new Date(endDate) as any;

    const d = Math.floor(b - a) / (1000 * 60 * 60 * 24);
    setDuration(d);
  };

  useEffect(() => {
    durationData(startMA, endMA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMA, endMA]);

  const onSubmit = async (data: any) => {
    // console.clear();
    setIsUpdate(true);
    const renewStart = data.renewStart;
    const renewEnd = data.renewEnd;

    let status: "advance" | "expire" | "active" = "advance";
    // const overlap = logs.every((m) =>
    //   checkTimeOverlap(m.ma.startMA, m.ma.endMA, renewStart, renewEnd) === false
    // );
    const overlapResult: boolean[] = [];
    logs.forEach((ma) => {
      const ol = checkTimeOverlap(
        renewStart,
        renewEnd,
        ma.ma.startMA,
        ma.ma.endMA
      );
      // if (ol) {
      // } else {
      // }
      overlapResult.push(ol);
    });
    const overlap = !overlapResult.every((x) => x === false);
    if (!overlap) {
      if (currentDate < renewStart) {
        status = "advance";
      } else {
        if (currentDate > renewEnd) {
          status = "expire";
        } else {
          status = "active";
        }
      }

      const newContract: MA = {
        startMA: renewStart,
        endMA: renewEnd,
        cost: data.renewCost,
        status: status,
        createdBy: { username: Auth.username, uid: Auth.uid },
        createdAt: currentDateTime,
        updateLogs: [
          {
            updatedBy: { username: Auth.username, uid: Auth.uid },
            timeStamp: currentDateTime,
            note: "ต่อสัญญา",
          },
        ],
      };
      // logs?.push(newContract)
      const MAref = collection(doc(db, "Project", props.projectId), "MAlogs");
      await addDoc(MAref, newContract)
        .then(() => {
          props.callBack();
          toast({
            title: "ต่อสัญญาสำเร็จ",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top",
          });
        })
        .catch((e) => {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: e,
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "top",
          });
        });
      reset();
      onClose();
    } else {
      toast({
        title: "ช่วงเวลาไม่ถูกต้อง",
        description: "กรุณาเลือกช่วงเวลาใหม่ที่ไม่ทับกับสัญญาอื่นๆ",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
    setIsUpdate(false);
  };

  return (
    <Box w="100%">
      {/* <Text display={"flex"}>
                <Text as="span" w="20%" textAlign={"center"} display="flex" justifyContent={"center"}><TiDocumentText /></Text>
                <Text as="span">การต่อสัญญา</Text>
            </Text> */}
      <Button
        onClick={() => {
          onOpen();
          reset();
        }}
        leftIcon={<TiDocumentText />}
        bg="#4C7BF4"
        color="#fff"
        fontWeight={"normal"}
        w="150px"
        borderRadius="16px"
        _hover={{ opacity: 0.8 }}
      >
        การต่อสัญญา
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          borderRadius={"16px"}
          w={{ base: "90%", sm: "90%", md: "30rem" }}
        >
          <ModalCloseButton color={"#fff"} />
          <ModalHeader
            bg="#4C7BF4"
            color={"#fff"}
            borderTopRadius={"16px"}
            textAlign="center"
          >
            ต่อสัญญา
          </ModalHeader>
          <ModalBody p="1.5rem">
            <Box>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="renewStart"
                  control={control}
                  defaultValue={moment().format("YYYY-MM-DD")}
                  render={({ field }) => (
                    <FormControl isRequired>
                      <Text>วันเริ่มต้นสัญญาใหม่</Text>
                      <Input borderRadius={"16px"} type="date" {...field} />
                    </FormControl>
                  )}
                />
                <Controller
                  name="renewEnd"
                  control={control}
                  defaultValue={moment().add(1, "year").format("YYYY-MM-DD")}
                  render={({ field }) => (
                    <FormControl isRequired>
                      <Text>วันสิ้นสุดสัญญาใหม่</Text>
                      <Input borderRadius={"16px"} type="date" {...field} />
                    </FormControl>
                  )}
                />
                <Text>
                  ระยะเวลา ={" "}
                  <Text as="span" fontWeight={"bold"}>
                    {duration}
                  </Text>{" "}
                  วัน
                </Text>
                {duration < 1 && (
                  <Text as="span" color="red">
                    ระยะเวลาอย่างน้อย 1 วัน
                  </Text>
                )}
                <Controller
                  name="renewCost"
                  control={control}
                  defaultValue={""}
                  render={({ field }) => (
                    <FormControl isRequired>
                      <Flex>
                        <Text>ค่าบริการ</Text>
                        <Text color="red">*</Text>
                      </Flex>

                      <Input
                        borderRadius={"16px"}
                        type="number"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                  )}
                />
                <Flex justify={"center"} mt="5">
                  <Button
                    borderRadius={"16px"}
                    mr="68px"
                    w="5rem"
                    colorScheme="gray"
                    onClick={onClose}
                    bg={"none"}
                    border={"1px solid #ccc"}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    borderRadius={"16px"}
                    w="5rem"
                    bg="#4C7BF4"
                    color="#fff"
                    _hover={{ opacity: "0.8" }}
                    type="submit"
                    isLoading={isUpdate}
                    isDisabled={duration < 1}
                  >
                    ยืนยัน
                  </Button>
                </Flex>
              </form>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Renewal;
